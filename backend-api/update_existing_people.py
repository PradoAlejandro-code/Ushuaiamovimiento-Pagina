import os
import django
from datetime import date

# Inicializar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from enrollments.models import Person

def run():
    print("Iniciando actualización de registros de Personas...")
    people = Person.objects.all()
    total_count = people.count()
    
    count = 0
    updated_age_count = 0
    updated_employment_count = 0
    
    today = date.today()
    
    for p in people:
        modified = False
        
        # 1. Calcular y setear la edad en base a la fecha de nacimiento
        if p.birth_date:
            calculated_age = today.year - p.birth_date.year - ((today.month, today.day) < (p.birth_date.month, p.birth_date.day))
            if p.age != calculated_age:
                p.age = calculated_age
                modified = True
                updated_age_count += 1
                
        # 2. Si employment_status está vacío, ponerle 'EMPLEADO'
        if not p.employment_status or str(p.employment_status).strip() == '':
            p.employment_status = 'EMPLEADO'
            modified = True
            updated_employment_count += 1
            
        if modified:
            # save() automáticamente convertirá a mayúsculas 'EMPLEADO' y guardará todo
            p.save()
            count += 1
            
    print("\n¡Completado con éxito!")
    print(f"- Total de personas revisadas en la base de datos: {total_count}")
    print(f"- Total de personas que requirieron actualización: {count}")
    print(f"- Edades recalculadas: {updated_age_count}")
    print(f"- Estados de empleo vacíos corregidos a 'EMPLEADO': {updated_employment_count}")

if __name__ == '__main__':
    run()
