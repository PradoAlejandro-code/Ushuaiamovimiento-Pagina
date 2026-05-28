import os
import io
import csv
import json
import threading
from datetime import datetime, date
import pandas as pd
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from enrollments.models import EnrollmentList, Enrollee, Person

class EnrollmentImportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _parse_date(self, date_str):
        if not date_str or pd.isna(date_str):
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

    def _sync_people_from_records(self, records, mapping):
        if not records:
            return {}, {"new": 0, "linked": 0, "duplicates": 0}

        field_overwrite = {}
        if mapping:
            person_to_csv = {v['personField']: k for k, v in mapping.items() if v.get('personField')}
            # Mapeamos cada campo del modelo con su respectivo estado de switch individual
            field_overwrite = {v['personField']: v.get('overwrite', False) for k, v in mapping.items() if v.get('personField')}
        else:
            cols = records[0].keys()
            def detect(keys):
                for k in cols:
                    if any(x in k.lower() for x in keys): return k
                return None
            person_to_csv = {
                'dni': detect(['dni', 'documento']),
                'first_name': detect(['nombre']),
                'last_name': detect(['apellido']),
                'email': detect(['email', 'mail']),
                'phone': detect(['tel', 'celular']),
                'profession': detect(['profesion']),
                'city': detect(['ciudad', 'localidad']),
                'address': detect(['domicilio', 'direccion']),
                'is_affiliate': detect(['afiliado']),
                'birth_date': detect(['nacimiento', 'birth_date']),
                'gender': detect(['genero', 'sexo']),
                'employment_status': detect(['estado', 'empleado']),
                'workplace': detect(['lugar', 'trabajo'])
            }
            # Si no hay mapeo explícito del frontend, por defecto no se sobrescribe nada existente
            field_overwrite = {k: False for k in person_to_csv.keys()}

        dni_col = person_to_csv.get('dni')
        fn_col = person_to_csv.get('first_name')
        ln_col = person_to_csv.get('last_name')

        dni_to_person = {}
        dnis_to_search = set()

        for rec in records:
            dni = rec.get(dni_col) if dni_col else None
            clean_dni = ''.join(filter(str.isdigit, str(dni))) if dni else None
            rec['_clean_dni'] = clean_dni
            if clean_dni:
                dnis_to_search.add(clean_dni)

        if dnis_to_search:
            for p in Person.objects.filter(dni__in=dnis_to_search):
                dni_to_person[p.dni] = p

        people_to_create = []
        people_to_update = []
        pending_dnis = set()
        today = date.today()

        for rec in records:
            clean_dni = rec.get('_clean_dni')
            fn = str(rec.get(fn_col, "")).strip().upper()
            ln = str(rec.get(ln_col, "")).strip().upper()
            
            if clean_dni and clean_dni in dni_to_person:
                p = dni_to_person[clean_dni]
                updated = False
                
                fields_to_check = {
                    'first_name': fn,
                    'last_name': ln,
                    'email': str(rec.get(person_to_csv.get('email'), "")).strip(),
                    'phone': ''.join(str(rec.get(person_to_csv.get('phone'), "")).split())[:50],
                    'profession': str(rec.get(person_to_csv.get('profession'), "")).strip().upper(),
                    'city': str(rec.get(person_to_csv.get('city'), "")).strip().upper(),
                    'address': str(rec.get(person_to_csv.get('address'), "")).strip().upper(),
                    'employment_status': str(rec.get(person_to_csv.get('employment_status'), "")).strip().upper(),
                    'workplace': str(rec.get(person_to_csv.get('workplace'), "")).strip().upper(),
                }
                
                for field, val in fields_to_check.items():
                    current_val = getattr(p, field)
                    if val:
                        # Si el campo en base de datos está vacío, se completa siempre
                        if not current_val:
                            setattr(p, field, val)
                            updated = True
                        # Si ya tiene información, solo se pisa si el switch individual está en True
                        elif field_overwrite.get(field, False) and current_val != val:
                            setattr(p, field, val)
                            updated = True
                
                # Fecha de nacimiento
                bd_raw = rec.get(person_to_csv.get('birth_date'))
                if bd_raw:
                    bd = self._parse_date(bd_raw)
                    if bd:
                        if not p.birth_date:
                            p.birth_date = bd
                            p.age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
                            updated = True
                        elif field_overwrite.get('birth_date', False) and p.birth_date != bd:
                            p.birth_date = bd
                            p.age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
                            updated = True

                # Género
                gen_raw = str(rec.get(person_to_csv.get('gender'), "")).strip().lower()
                if gen_raw:
                    new_gen = None
                    if gen_raw.startswith('m') or 'masc' in gen_raw: new_gen = 'M'
                    elif gen_raw.startswith('f') or 'fem' in gen_raw: new_gen = 'F'
                    
                    if new_gen:
                        if not p.gender:
                            p.gender = new_gen
                            updated = True
                        elif field_overwrite.get('gender', False) and p.gender != new_gen:
                            p.gender = new_gen
                            updated = True
                
                # Afiliado
                aff_val = str(rec.get(person_to_csv.get('is_affiliate'), "")).lower()
                if aff_val:
                    is_aff_new = any(x in aff_val for x in ['si', 'yes', 'true', '1', 'afiliado'])
                    if field_overwrite.get('is_affiliate', False):
                        if p.is_affiliate != is_aff_new:
                            p.is_affiliate = is_aff_new
                            updated = True
                    else:
                        if not p.is_affiliate and is_aff_new:
                            p.is_affiliate = True
                            updated = True

                if updated and p not in people_to_update:
                    people_to_update.append(p)
                continue

            if clean_dni:
                if clean_dni not in pending_dnis:
                    pending_dnis.add(clean_dni)
                else:
                    continue
            
            if not (fn or ln or clean_dni):
                continue

            em = str(rec.get(person_to_csv.get('email'), "")).strip()
            ph = ''.join(str(rec.get(person_to_csv.get('phone'), "")).split())[:50]
            prof = str(rec.get(person_to_csv.get('profession'), "")).strip().upper()
            city = str(rec.get(person_to_csv.get('city'), "USHUAIA")).strip().upper()
            addr = str(rec.get(person_to_csv.get('address'), "")).strip().upper()
            
            emp_stat = str(rec.get(person_to_csv.get('employment_status'), "")).strip().upper()
            if not emp_stat:
                emp_stat = 'EMPLEADO'
            
            workpl = str(rec.get(person_to_csv.get('workplace'), "")).strip().upper()
            bd = self._parse_date(rec.get(person_to_csv.get('birth_date')))
            
            # Cálculo de edad para bulk_create
            age_val = None
            if bd:
                age_val = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))

            gen_raw = str(rec.get(person_to_csv.get('gender'), "")).strip().lower()
            if gen_raw.startswith('m') or 'masc' in gen_raw: gen = 'M'
            elif gen_raw.startswith('f') or 'fem' in gen_raw: gen = 'F'
            else: gen = None

            aff_val = str(rec.get(person_to_csv.get('is_affiliate'), "")).lower()
            is_aff = any(x in aff_val for x in ['si', 'yes', 'true', '1', 'afiliado']) if aff_val else False

            people_to_create.append(Person(
                dni=clean_dni,
                first_name=fn,
                last_name=ln,
                email=em,
                phone=ph,
                birth_date=bd,
                age=age_val,
                gender=gen,
                profession=prof,
                employment_status=emp_stat,
                workplace=workpl,
                city=city,
                address=addr,
                is_affiliate=is_aff
            ))

        if people_to_create:
            Person.objects.bulk_create(people_to_create, batch_size=2000, ignore_conflicts=True)

        if people_to_update:
            Person.objects.bulk_update(people_to_update, [
                'first_name', 'last_name', 'email', 'phone', 
                'profession', 'city', 'address', 'birth_date', 'age', 'is_affiliate',
                'gender', 'employment_status', 'workplace'
            ], batch_size=2000)
            
        final_person_map = {}
        if dnis_to_search:
            for p in Person.objects.filter(dni__in=dnis_to_search):
                final_person_map[p.dni] = p

        name_search_map = {}
        no_dni_names = set()
        for rec in records:
            if not rec.get('_clean_dni'):
                fn = str(rec.get(fn_col, "")).strip().upper()
                ln = str(rec.get(ln_col, "")).strip().upper()
                if fn and ln:
                    no_dni_names.add((fn, ln))
        
        # ¡AQUÍ ESTABA EL ERROR DEL FREEZE! Búsqueda limpia y exacta.
        if no_dni_names:
            names_list = list(no_dni_names)
            for i in range(0, len(names_list), 500):
                chunk = names_list[i:i+500]
                query = Q()
                for fn, ln in chunk:
                    query |= Q(first_name=fn, last_name=ln)
                
                if query:
                    candidates = Person.objects.filter(query, dni__isnull=True)
                    for p in candidates:
                        name_search_map[(p.first_name, p.last_name)] = p

        record_person_map = {}
        for i, rec in enumerate(records):
            clean_dni = rec.get('_clean_dni')
            if clean_dni and clean_dni in final_person_map:
                record_person_map[i] = final_person_map[clean_dni]
            else:
                fn = str(rec.get(fn_col, "")).strip().upper()
                ln = str(rec.get(ln_col, "")).strip().upper()
                record_person_map[i] = name_search_map.get((fn, ln))

        stats = {
            "new": len(people_to_create),
            "linked": len(dni_to_person) + len(name_search_map),
            "duplicates": len(records) - (len(people_to_create) + len(dni_to_person) + len(name_search_map))
        }
                
        return record_person_map, stats

    def _process_csv_background(self, temp_path, enrollment_list_id, mapping_raw):
        from django.db import connection
        try:
            mapping = json.loads(mapping_raw)
            cols_to_keep = [k for k, v in mapping.items() if v.get('keepInPadron')]
            
            enrollment_list = EnrollmentList.objects.get(id=enrollment_list_id)
            enrollment_list.last_import_status = 'processing'
            enrollment_list.save()

            try:
                from enrollments.models import ListField
                enrollment_list = EnrollmentList.objects.get(id=enrollment_list_id)
                existing_fields = set(enrollment_list.fields.values_list('name', flat=True))
                current_order = enrollment_list.fields.count()
                
                new_fields = []
                for col in cols_to_keep:
                    if col not in existing_fields:
                        new_fields.append(
                            ListField(
                                enrollment_list=enrollment_list,
                                name=col,
                                label=col,
                                field_type='text',
                                order=current_order
                            )
                        )
                        current_order += 1
                
                if new_fields:
                    ListField.objects.bulk_create(new_fields)
            except Exception as e:
                pass

            with open(temp_path, 'rb') as assembled_file:
                chunk_for_enc = assembled_file.read(1024 * 10)
                assembled_file.seek(0)
                encodings = ['utf-8-sig', 'latin-1', 'cp1252']
                encoding = 'utf-8'
                for enc in encodings:
                    try:
                        chunk_for_enc.decode(enc)
                        encoding = enc
                        break
                    except: continue
                
                assembled_file.seek(0)
                sample = assembled_file.read(1024 * 10).decode(encoding)
                try: delimiter = csv.Sniffer().sniff(sample).delimiter
                except: delimiter = ';'

            reader = pd.read_csv(temp_path, sep=delimiter, engine='c', chunksize=10000, encoding=encoding, dtype=str, low_memory=False)
            
            total_stats = {"new": 0, "linked": 0, "duplicates": 0}
            
            existing_enrollee_person_ids = set(
                Enrollee.objects.filter(enrollment_list_id=enrollment_list_id, person__isnull=False)
                .values_list('person_id', flat=True)
            )
            
            for chunk_data in reader:
                chunk_data = chunk_data.loc[:, ~chunk_data.columns.str.contains('^Unnamed')]
                records = chunk_data.fillna("").to_dict(orient='records')
                
                person_map, chunk_stats = self._sync_people_from_records(records, mapping)
                
                for k in total_stats: total_stats[k] += chunk_stats.get(k, 0)

                enrollees_to_create = []
                for idx, record in enumerate(records):
                    person = person_map.get(idx)
                    if person and person.id in existing_enrollee_person_ids:
                        total_stats["duplicates"] += 1
                        continue
                    enrollees_to_create.append(Enrollee(
                        enrollment_list_id=enrollment_list_id,
                        person=person,
                        dynamic_data={k: str(record[k]).upper() if isinstance(record[k], str) else record[k] for k in cols_to_keep if k in record}
                    ))
                    if person:
                        existing_enrollee_person_ids.add(person.id)
                
                if enrollees_to_create:
                    Enrollee.objects.bulk_create(enrollees_to_create, batch_size=5000)
            
            enrollment_list.last_import_status = 'completed'
            enrollment_list.last_import_stats = total_stats
            enrollment_list.save()
            
        except Exception as e:
            try:
                enrollment_list = EnrollmentList.objects.get(id=enrollment_list_id)
                enrollment_list.last_import_status = 'error'
                enrollment_list.save()
            except: pass
        finally:
            connection.close() 
            if os.path.exists(temp_path):
                os.remove(temp_path)

    @action(detail=False, methods=['post'], url_path='enrollments/(?P<pk>[^/.]+)/preview')
    def preview_import(self, request, pk=None):
        try:
            EnrollmentList.objects.get(pk=pk)
        except EnrollmentList.DoesNotExist:
            return Response({"error": "Lista no encontrada"}, status=status.HTTP_404_NOT_FOUND)
            
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({"error": "No se subió archivo"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            chunk = file_obj.read(1024 * 50)
            file_obj.seek(0)
            
            encodings = ['utf-8-sig', 'latin-1', 'cp1252']
            decoded_chunk = None
            encoding = 'utf-8'
            for enc in encodings:
                try:
                    decoded_chunk = chunk.decode(enc)
                    encoding = enc
                    break
                except UnicodeDecodeError:
                    continue
            
            if not decoded_chunk:
                return Response({"error": "Codificación no soportada"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                delimiter = csv.Sniffer().sniff(decoded_chunk).delimiter
            except Exception:
                delimiter = ';'

            df_preview = pd.read_csv(io.StringIO(decoded_chunk), sep=delimiter, engine='c', nrows=2, dtype=str)
            df_preview = df_preview.loc[:, ~df_preview.columns.str.contains('^Unnamed')]
            
            return Response({
                "headers": list(df_preview.columns),
                "preview": [],
                "total_rows": 0
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='enrollments/(?P<pk>[^/.]+)/status')
    def import_status(self, request, pk=None):
        try:
            enrollment_list = EnrollmentList.objects.get(pk=pk)
            return Response({
                "status": enrollment_list.last_import_status,
                "stats": enrollment_list.last_import_stats
            })
        except EnrollmentList.DoesNotExist:
            return Response({"error": "Lista no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='enrollments/(?P<pk>[^/.]+)/confirm')
    def confirm_import(self, request, pk=None):
        try:
            enrollment_list = EnrollmentList.objects.get(pk=pk)
        except EnrollmentList.DoesNotExist:
            return Response({"error": "Lista no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        chunk_file = request.FILES.get('file')
        upload_id = request.data.get('upload_id')
        chunk_index = int(request.data.get('chunk_index', 0))
        total_chunks = int(request.data.get('total_chunks', 1))

        if not chunk_file or not upload_id:
            return Response({"error": "Faltan datos del chunk"}, status=status.HTTP_400_BAD_REQUEST)

        temp_dir = os.path.join(os.getcwd(), 'tmp_imports')
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"upload_{upload_id}.csv")

        try:
            with open(temp_path, 'ab') as f:
                for chunk in chunk_file.chunks():
                    f.write(chunk)

            if chunk_index < total_chunks - 1:
                return Response({"status": "uploading", "chunk": chunk_index})

            mapping_raw = request.data.get('mapping', '{}')
            thread = threading.Thread(
                target=self._process_csv_background, 
                args=(temp_path, enrollment_list.id, mapping_raw)
            )
            thread.start()
            
            return Response({
                "status": "processing", 
                "message": "Archivo subido. Los datos se están procesando e insertando en segundo plano."
            })
            
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)