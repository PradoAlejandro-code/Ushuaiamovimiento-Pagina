import os
import django
import sys

# Setup django
sys.path.append('/home/bell/Documentos/trabajo pagina/backend-api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from enrollments.models import Enrollee, Person

def migrate_to_people():
    enrollees = Enrollee.objects.filter(person__isnull=True)
    count = 0
    linked = 0
    
    for en in enrollees:
        data = {k.lower(): v for k, v in en.dynamic_data.items()}
        
        # Extract fields
        dni = data.get('dni', data.get('documento', data.get('nro documento', ''))).strip()
        # Clean DNI (remove dots, etc)
        if dni:
            dni = ''.join(filter(str.isdigit, str(dni)))
        
        first_name = data.get('nombre', data.get('nombres', '')).strip()
        last_name = data.get('apellido', data.get('apellidos', '')).strip()
        email = data.get('email', data.get('correo', data.get('mail', ''))).strip()
        phone = data.get('telefono', data.get('celular', data.get('tel', ''))).strip()
        address = data.get('direccion', data.get('domicilio', '')).strip()
        
        if not dni and not first_name and not last_name:
            continue
            
        person = None
        if dni:
            person = Person.objects.filter(dni=dni).first()
            
        if not person:
            person = Person.objects.create(
                first_name=first_name,
                last_name=last_name,
                dni=dni if dni else None,
                email=email,
                phone=phone,
                address=address
            )
            count += 1
        
        en.person = person
        en.save()
        linked += 1
        
    print(f"Migration complete: {count} new people created, {linked} enrollees linked.")

if __name__ == "__main__":
    migrate_to_people()
