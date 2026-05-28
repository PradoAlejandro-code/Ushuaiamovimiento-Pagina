
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from enrollments.models import EnrollmentList, Person, Enrollee

# Obtener el padrón más reciente
el = EnrollmentList.objects.order_by('-created_at').first()
if not el:
    print("No hay padrones.")
    exit()

print(f"Padrón: {el.name} (ID: {el.id})")
fields = el.fields.all()
print(f"Campos: {[f.name for f in fields]}")

enrollees = el.enrollees.all()
print(f"Total enrollees: {enrollees.count()}")
print(f"Ya vinculados: {enrollees.filter(person__isnull=False).count()}")

# Ver mapeo que haría sync_to_people
mapping = {}
for f in fields:
    name = f.name.upper()
    if 'DNI' in name: mapping[f.name] = 'dni'
    elif 'NOMBRE' in name: mapping[f.name] = 'first_name'
    elif 'APELLIDO' in name: mapping[f.name] = 'last_name'

print(f"Mapeo detectado: {mapping}")

# Probar con los primeros 5
for en in enrollees[:5]:
    data = en.dynamic_data or {}
    dni_key = next((k for k,v in mapping.items() if v=='dni'), None)
    if dni_key:
        dni = str(data.get(dni_key, "")).strip()
        print(f"Enrollee {en.id} - DNI extraído: '{dni}'")
        if dni:
            person = Person.objects.filter(dni=dni).first()
            if person:
                print(f"  -> Persona encontrada: {person.first_name} {person.last_name}")
            else:
                print(f"  -> Persona NO encontrada en la tabla Person.")
        else:
            print(f"  -> DNI vacío.")
    else:
        print(f"Enrollee {en.id} - No se pudo encontrar columna DNI en el mapeo.")
