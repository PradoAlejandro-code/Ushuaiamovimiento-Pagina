from datetime import datetime, date
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import models
from django.db.models import Count, Q
from .models import EnrollmentList, ListField, Enrollee, Person
from .serializers import EnrollmentListSerializer, EnrolleeSerializer, PersonSerializer, ListFieldSerializer

class EnrollmentListViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def _parse_date(self, date_str):
        if not date_str or pd.isna(date_str) if 'pd' in globals() else False:
            return None
        
        date_str = str(date_str).strip().lower()
        
        # 1. Reemplazamos los meses en español por sus números
        meses_es = {
            'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
            'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
        }
        for mes_texto, mes_num in meses_es.items():
            if mes_texto in date_str:
                date_str = date_str.replace(mes_texto, mes_num)

        # 2. Agregamos los formatos con año de 2 dígitos (%y)
        formats = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d', '%d-%m-%y', '%d/%m/%y']
        
        for fmt in formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt).date()
                
                # 3. Corrección: si el año calculado es mayor al actual (ej. 2029), restamos 100 años (1929)
                if parsed_date.year > date.today().year:
                    parsed_date = parsed_date.replace(year=parsed_date.year - 100)
                    
                return parsed_date
            except (ValueError, TypeError):
                continue
                
        return None
    
    @action(detail=True, methods=['post'], url_path='migrate-to-people')
    def migrate_to_people(self, request, pk=None):
        old_list = self.get_object()
        mapping = request.data.get('mapping', {}) 
        create_new = request.data.get('create_new', False)
        new_name = request.data.get('new_name', f"{old_list.name} (MIGRADO)")
        include_extra_columns = request.data.get('include_extra_columns', False)
        
        if not mapping:
            return Response({"error": "No se proporcionó mapeo de campos"}, status=status.HTTP_400_BAD_REQUEST)
        
        target_list = old_list
        standard_fields = [
            ('dni', 'DNI'),
            ('last_name', 'Apellido'),
            ('first_name', 'Nombre'),
            ('email', 'Email'),
            ('phone', 'Teléfono'),
            ('profession', 'Profesión'),
            ('city', 'Ciudad'),
            ('address', 'Domicilio'),
            ('is_affiliate', 'Afiliado'),
            ('birth_date', 'Fecha Nac.'),
            ('gender', 'Género'),
            ('employment_status', 'Estado Empleado'),
            ('workplace', 'Lugar de Trabajo'),
        ]

        if create_new:
            target_list = EnrollmentList.objects.create(name=new_name)
            
            if include_extra_columns:
                current_count = 0
                for col_name in old_list.fields.values_list('name', flat=True):
                    if col_name not in mapping:
                        old_f = old_list.fields.filter(name=col_name).first()
                        ListField.objects.create(
                            enrollment_list=target_list,
                            name=col_name,
                            label=old_f.label,
                            field_type=old_f.field_type,
                            order=current_count,
                            is_visible=True
                        )
                        current_count += 1

        enrollees = old_list.enrollees.all()
        created_count = 0
        linked_count = 0
        migrated_count = 0
        
        for en in enrollees:
            data = en.dynamic_data
            person_data = {}
            
            dni_col = next((col for col, field in mapping.items() if field == 'dni'), None)
            dni = str(data.get(dni_col, '')).strip() if dni_col else None
            if dni:
                dni = ''.join(filter(str.isdigit, dni))
            
            for col, person_field in mapping.items():
                if person_field == 'dni': continue
                val = data.get(col, '')
                if val:
                    if person_field == 'is_affiliate':
                        aff_val = str(val).lower()
                        person_data[person_field] = any(x in aff_val for x in ['si', 'yes', 'true', '1', 'afiliado'])
                    elif person_field == 'birth_date':
                        person_data[person_field] = self._parse_date(val)
                    elif person_field == 'age':
                        if str(val).isdigit():
                            person_data[person_field] = int(val)
                    elif person_field == 'gender':
                        gen_val = str(val).lower()
                        if 'masculino' in gen_val or gen_val == 'm':
                            person_data[person_field] = 'M'
                        elif 'femenino' in gen_val or gen_val == 'f':
                            person_data[person_field] = 'F'
                    else:
                        person_data[person_field] = str(val).strip().upper()
            
            person = en.person 
            if not person and dni:
                person = Person.objects.filter(dni=dni).first()
            
            if not person:
                if dni or person_data.get('first_name') or person_data.get('last_name'):
                    person = Person.objects.create(dni=dni if dni else None, **person_data)
                    created_count += 1
            else:
                updated = False
                for k, v in person_data.items():
                    if v and not getattr(person, k):
                        setattr(person, k, v)
                        updated = True
                if updated:
                    person.save()
            
            if person:
                if create_new:
                    new_dynamic_data = {}
                    for f_id, f_label in standard_fields:
                        col_name = next((col for col, pf in mapping.items() if pf == f_id), f_id)
                        val = getattr(person, f_id, "")
                        if f_id == 'is_affiliate':
                            new_dynamic_data[col_name] = "AFILIADO" if val else "NO AFILIADO"
                        else:
                            orig_val = data.get(next((c for c, p in mapping.items() if p == f_id), ""), "")
                            new_dynamic_data[col_name] = str(val) if val else str(orig_val)
                    
                    if include_extra_columns:
                        for col_name, val in data.items():
                            if col_name not in mapping:
                                new_dynamic_data[col_name] = val

                    Enrollee.objects.create(
                        enrollment_list=target_list,
                        person=person,
                        dynamic_data=new_dynamic_data
                    )
                    migrated_count += 1
                else:
                    en.person = person
                    en.save()
                    linked_count += 1
                
        return Response({
            "status": "success",
            "created_people": created_count,
            "linked_records": linked_count,
            "migrated_to_new_list": migrated_count,
            "new_list_id": target_list.id if create_new else None
        })

    def get_queryset(self):
        return EnrollmentList.objects.annotate(enrollee_count=Count('enrollees')).order_by('-created_at')

class EnrolleePagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

class EnrolleeViewSet(viewsets.ModelViewSet):
    serializer_class = EnrolleeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = EnrolleePagination

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        Enrollee.objects.filter(id__in=ids).delete()
        return Response({"status": "success", "deleted_count": len(ids)})
    
    def get_queryset(self):
        queryset = Enrollee.objects.all().order_by('-id')
        
        enrollment_list_id = self.request.query_params.get('enrollment_list')
        if enrollment_list_id:
            queryset = queryset.filter(enrollment_list_id=enrollment_list_id)

        ignored_params = {'enrollment_list', 'page', 'page_size', 'limit', 'offset', 'format', 'ordering', 'search'}
        person_fields = [f.name for f in Person._meta.fields]
        
        for key, value in self.request.query_params.items():
            if key not in ignored_params and value and value.lower() != 'all':
                # Si el filtro empieza con 'person.', buscamos en el modelo Person vinculado
                person_field = None
                if key.startswith('person.'):
                    person_field = key.replace('person.', '')
                elif key in person_fields:
                    person_field = key

                if person_field:
                    if person_field == 'is_affiliate':
                        val_bool = str(value).lower() in ['true', '1', 't', 'yes', 'si']
                        queryset = queryset.filter(
                            Q(person__is_affiliate=val_bool) | 
                            Q(dynamic_data__is_affiliate__icontains=value) |
                            Q(dynamic_data__AFILIADO__icontains=value)
                        )
                    elif person_field in ['age', 'birth_date']:
                        try:
                            if person_field == 'birth_date':
                                if '/' in value:
                                    parts = value.split('/')
                                    if len(parts) == 3:
                                        value = f"{parts[2]}-{parts[1]}-{parts[0]}"
                            
                            fallback_keys = [person_field, person_field.upper(), person_field.capitalize()]
                            if person_field == 'birth_date':
                                fallback_keys += ['FECHA NAC', 'FECHA NACIMIENTO']
                                
                            q_expr = Q(**{f"person__{person_field}__icontains": value})
                            for fk in fallback_keys:
                                q_expr |= Q(**{f"dynamic_data__{fk}__icontains": value})
                            queryset = queryset.filter(q_expr)
                        except Exception:
                            pass
                    else:
                        fallback_keys = [person_field, person_field.upper(), person_field.capitalize()]
                        if person_field == 'first_name':
                            fallback_keys += ['NOMBRE', 'NOMBRES']
                        elif person_field == 'last_name':
                            fallback_keys += ['APELLIDO', 'APELLIDOS']
                        elif person_field == 'dni':
                            fallback_keys += ['DNI', 'DOCUMENTO']
                        elif person_field == 'city':
                            fallback_keys += ['CIUDAD']
                        elif person_field == 'workplace':
                            fallback_keys += ['LUGAR DE TRABAJO', 'TRABAJO']
                        elif person_field == 'employment_status':
                            fallback_keys += ['ESTADO EMPLEADO', 'EMPLEADO']
                        
                        q_expr = Q(**{f"person__{person_field}__icontains": value})
                        for fk in fallback_keys:
                            q_expr |= Q(**{f"dynamic_data__{fk}__icontains": value})
                        queryset = queryset.filter(q_expr)
                else:
                    # De lo contrario, buscamos en los datos dinámicos del enrollee
                    lookup = f"dynamic_data__{key}__icontains"
                    queryset = queryset.filter(**{lookup: value})
                
                queryset = queryset.distinct()
                
        ordering = self.request.query_params.get('ordering')
        if ordering:
            if ordering.startswith('-'):
                sort_field = ordering[1:]
                queryset = queryset.order_by(f"-dynamic_data__{sort_field}")
            else:
                queryset = queryset.order_by(f"dynamic_data__{ordering}")
                
        return queryset

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all().order_by('-created_at')
    serializer_class = PersonSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = EnrolleePagination

    @action(detail=False, methods=['get'], url_path='cities')
    def cities(self, request):
        """Devuelve todas las ciudades únicas de la tabla Person con su conteo."""
        qs = Person.objects.all()
        enrollment_list = request.query_params.get('enrollment_list')
        if enrollment_list:
            qs = qs.filter(enrollments__enrollment_list_id=enrollment_list)
            
        cities_qs = (
            qs
            .exclude(city__isnull=True)
            .exclude(city='')
            .values('city')
            .annotate(count=Count('city'))
            .order_by('-count')
        )
        return Response([{'city': row['city'], 'count': row['count']} for row in cities_qs])

    @action(detail=False, methods=['get'], url_path='workplaces')
    def workplaces(self, request):
        """Devuelve todos los lugares de trabajo únicos de la tabla Person con su conteo."""
        qs = Person.objects.all()
        enrollment_list = request.query_params.get('enrollment_list')
        if enrollment_list:
            qs = qs.filter(enrollments__enrollment_list_id=enrollment_list)
            
        workplaces_qs = (
            qs
            .exclude(workplace__isnull=True)
            .exclude(workplace='')
            .values('workplace')
            .annotate(count=Count('workplace'))
            .order_by('-count')
        )
        return Response([{'workplace': row['workplace'], 'count': row['count']} for row in workplaces_qs])

    @action(detail=False, methods=['get'], url_path='employment-statuses')
    def employment_statuses(self, request):
        """Devuelve todos los estados de empleo únicos de la tabla Person con su conteo."""
        qs = Person.objects.all()
        enrollment_list = request.query_params.get('enrollment_list')
        if enrollment_list:
            qs = qs.filter(enrollments__enrollment_list_id=enrollment_list)
            
        statuses_qs = (
            qs
            .exclude(employment_status__isnull=True)
            .exclude(employment_status='')
            .values('employment_status')
            .annotate(count=Count('employment_status'))
            .order_by('-count')
        )
        return Response([{'employment_status': row['employment_status'], 'count': row['count']} for row in statuses_qs])

    def get_queryset(self):
        queryset = super().get_queryset()
        
        ignored_params = {'page', 'page_size', 'limit', 'offset', 'format', 'ordering', 'search'}
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(dni__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(profession__icontains=search) |
                Q(city__icontains=search)
            )

        for key, value in self.request.query_params.items():
            if key not in ignored_params and value and value.lower() != 'all':
                if hasattr(Person, key):
                    if key == 'is_affiliate':
                        val_bool = str(value).lower() in ['true', '1', 't', 'yes', 'si']
                        queryset = queryset.filter(**{key: val_bool})
                    elif key in ['age', 'birth_date']:
                        try:
                            if key == 'birth_date':
                                if '/' in value:
                                    parts = value.split('/')
                                    if len(parts) == 3:
                                        value = f"{parts[2]}-{parts[1]}-{parts[0]}"
                            queryset = queryset.filter(**{f"{key}__icontains": value})
                        except Exception:
                            pass
                    else:
                        lookup = f"{key}__icontains"
                        queryset = queryset.filter(**{lookup: value})
                elif key == 'padrones':
                    queryset = queryset.filter(enrollments__enrollment_list__name__icontains=value).distinct()

        ordering = self.request.query_params.get('ordering')
        if ordering:
            order_field = ordering.lstrip('-')
            if hasattr(Person, order_field):
                queryset = queryset.order_by(ordering)

        return queryset

    @action(detail=False, methods=['get'], url_path='birthdays')
    def birthdays(self, request):
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.localtime(timezone.now()).date()
        
        day = request.query_params.get('day', 'today')
        if day == 'tomorrow':
            target_date = today + timedelta(days=1)
        elif day == 'after_tomorrow':
            target_date = today + timedelta(days=2)
        else:
            target_date = today
            
        # Utilizamos self.get_queryset() para heredar la búsqueda, filtros dinámicos (city, is_affiliate, etc.) y ordenamiento
        queryset = self.get_queryset().filter(
            birth_date__month=target_date.month, 
            birth_date__day=target_date.day
        )
                
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='assign-birthdays')
    def assign_birthdays(self, request):
        person_ids = request.data.get('person_ids', [])
        user_id = request.data.get('user_id')
        anio = request.data.get('anio', date.today().year)
        
        if not person_ids or not user_id:
            return Response({"error": "Faltan person_ids o user_id"}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            employee = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Empleado no encontrado"}, status=status.HTTP_404_NOT_FOUND)
            
        from .models import AsignacionCumpleanos
        created_count = 0
        updated_count = 0
        
        for p_id in person_ids:
            assignment, created = AsignacionCumpleanos.objects.update_or_create(
                persona_id=p_id,
                anio=anio,
                defaults={'empleado': employee}
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        return Response({
            "status": "success",
            "created": created_count,
            "updated": updated_count
        })

    @action(detail=True, methods=['post'], url_path='deliver-birthday')
    def deliver_birthday(self, request, pk=None):
        from .models import AsignacionCumpleanos
        from django.utils import timezone
        person = self.get_object()
        current_year = timezone.localtime().year
        
        assignment = AsignacionCumpleanos.objects.filter(
            persona=person,
            anio=current_year
        ).first()
        
        if not assignment:
            return Response({"error": "No hay asignación activa para este cumpleaños en este año."}, status=404)
            
        assignment.entregado = True
        
        observacion = request.data.get('observacion')
        if observacion:
            assignment.observacion = observacion
            
        assignment.save()
        
        return Response({"status": "success", "message": "Cumpleaños marcado como entregado con éxito."})

    @action(detail=False, methods=['get'], url_path='pending-observations')
    def pending_observations(self, request):
        from .models import AsignacionCumpleanos
        qs = AsignacionCumpleanos.objects.filter(
            observacion__isnull=False,
            observacion_resuelta=False
        ).exclude(observacion='').select_related('persona', 'empleado')
        
        from .serializers import PersonSerializer
        data = []
        for item in qs:
            emp_name = "Sin empleado"
            picture_url = None
            if item.empleado:
                full_name = f"{item.empleado.first_name} {item.empleado.last_name}".strip()
                emp_name = full_name if full_name else item.empleado.username
                if item.empleado.profile_picture:
                    picture_url = request.build_absolute_uri(item.empleado.profile_picture.url)
                    if picture_url.startswith('http://api.ushuaiamovimiento.com.ar'):
                        picture_url = picture_url.replace('http://', 'https://')
            
            data.append({
                "id": item.id,
                "persona": PersonSerializer(item.persona, context={'request': request}).data,
                "empleado_nombre": emp_name,
                "empleado_picture": picture_url,
                "observacion": item.observacion,
                "anio": item.anio
            })
            
        return Response(data)

    @action(detail=False, methods=['post'], url_path='resolve-observation')
    def resolve_observation(self, request):
        from .models import AsignacionCumpleanos
        assignment_id = request.data.get('assignment_id')
        if not assignment_id:
            return Response({"error": "Falta assignment_id"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            assignment = AsignacionCumpleanos.objects.get(id=assignment_id)
        except AsignacionCumpleanos.DoesNotExist:
            return Response({"error": "Asignación no encontrada"}, status=status.HTTP_444_NOT_FOUND if hasattr(status, 'HTTP_444_NOT_FOUND') else status.HTTP_404_NOT_FOUND)
            
        assignment.observacion_resuelta = True
        assignment.save()
        
        return Response({"status": "success", "message": "Observación marcada como resuelta."})


class ListFieldViewSet(viewsets.ModelViewSet):
    queryset = ListField.objects.all()
    serializer_class = ListFieldSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None