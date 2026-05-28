from rest_framework import serializers
from .models import EnrollmentList, ListField, Enrollee, Person

class ListFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListField
        fields = ['id', 'name', 'label', 'field_type', 'is_visible', 'is_searchable', 'order']
        extra_kwargs = {
            'label': {'required': False},
            'is_visible': {'required': False},
            'is_searchable': {'required': False},
            'order': {'required': False},
        }

class EnrollmentListSerializer(serializers.ModelSerializer):
    fields = ListFieldSerializer(many=True, required=False)
    table_columns = serializers.SerializerMethodField()
    # This will be populated if we annotate the queryset
    enrollee_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = EnrollmentList
        fields = ['id', 'name', 'created_at', 'fields', 'table_columns', 'enrollee_count', 'ui_settings']

    def get_table_columns(self, obj):
        # 1. Columnas Estándar (Vienen de la relación Person)
        standard_cols = [
            {'id': 'dni', 'header': 'DNI', 'accessorKey': 'person.dni'},
            {'id': 'last_name', 'header': 'Apellido', 'accessorKey': 'person.last_name'},
            {'id': 'first_name', 'header': 'Nombre', 'accessorKey': 'person.first_name'},
            {'id': 'gender', 'header': 'Género', 'accessorKey': 'person.gender'},
            {'id': 'age', 'header': 'Edad', 'accessorKey': 'person.age'},
            {'id': 'email', 'header': 'Email', 'accessorKey': 'person.email'},
            {'id': 'phone', 'header': 'Teléfono', 'accessorKey': 'person.phone'},
            {'id': 'birth_date', 'header': 'Fecha Nac.', 'accessorKey': 'person.birth_date'},
            {'id': 'profession', 'header': 'Profesión', 'accessorKey': 'person.profession'},
            {'id': 'employment_status', 'header': 'Estado Empleado', 'accessorKey': 'person.employment_status'},
            {'id': 'workplace', 'header': 'Lugar de Trabajo', 'accessorKey': 'person.workplace'},
            {'id': 'city', 'header': 'Ciudad', 'accessorKey': 'person.city'},
            {'id': 'address', 'header': 'Domicilio', 'accessorKey': 'person.address'},
            {'id': 'is_affiliate', 'header': 'Afiliado', 'accessorKey': 'person.is_affiliate', 'type': 'boolean'},
        ]
        
        # 2. Columnas Dinámicas (Vienen de ListField)
        custom_cols = [
            {
                'id': field.name,
                'header': field.label,
                'accessorKey': f'dynamic_data.{field.name}',
                'type': field.field_type
            }
            for field in obj.fields.all().order_by('order')
        ]
        
        return standard_cols + custom_cols

    def create(self, validated_data):
        fields_data = validated_data.pop('fields', [])
        enrollment_list = EnrollmentList.objects.create(**validated_data)
        for field_data in fields_data:
            ListField.objects.create(enrollment_list=enrollment_list, **field_data)
        return enrollment_list

class PersonSerializer(serializers.ModelSerializer):
    padrones = serializers.SerializerMethodField()
    asignacion_actual = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            'id', 'first_name', 'last_name', 'dni', 'email', 'phone', 
            'birth_date', 'age', 'gender', 'address', 'profession', 
            'employment_status', 'workplace', 'city', 'is_affiliate', 'created_at', 'padrones', 'asignacion_actual'
        ]

    def get_padrones(self, obj):
        # Obtener los nombres de todos los padrones donde está esta persona
        return ", ".join(obj.enrollments.values_list('enrollment_list__name', flat=True).distinct())

    def get_asignacion_actual(self, obj):
        from django.utils import timezone
        current_year = timezone.localtime().year
        assignment = obj.cumpleanos_asignados.filter(anio=current_year).first()
        if assignment:
            empleado = assignment.empleado
            picture_url = None
            if empleado and empleado.profile_picture:
                request = self.context.get('request')
                if request:
                    picture_url = request.build_absolute_uri(empleado.profile_picture.url)
                    if picture_url.startswith('http://api.ushuaiamovimiento.com.ar'):
                        picture_url = picture_url.replace('http://', 'https://')
                else:
                    picture_url = empleado.profile_picture.url

            return {
                'id': assignment.id,
                'empleado_id': assignment.empleado_id,
                'empleado_name': f"{empleado.first_name} {empleado.last_name}".strip() or empleado.username if empleado else None,
                'empleado_picture': picture_url,
                'entregado': assignment.entregado,
                'observacion': assignment.observacion,
                'anio': assignment.anio
            }
        return None

class EnrolleeSerializer(serializers.ModelSerializer):
    person = PersonSerializer(read_only=True)
    class Meta:
        model = Enrollee
        fields = ['id', 'enrollment_list', 'person', 'dynamic_data', 'created_at']
