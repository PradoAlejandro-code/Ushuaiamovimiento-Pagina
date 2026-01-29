import pandas as pd
from django.db import transaction
from .models import Contacto

def importar_contactos_inteligente(archivo_csv, tag=None):
    """
    Lee un CSV, limpia los datos y guarda contactos masivamente.
    Retorna: (total_procesados, total_creados, errores)
    """
    
    # 1. CARGAR EL CSV CON PANDAS
    try:
        # Intentar leer por defecto (utf-8)
        df = pd.read_csv(archivo_csv, dtype=str)
    except Exception:
        # Si falla, probar con encoding latino
        try:
            archivo_csv.seek(0)
            df = pd.read_csv(archivo_csv, encoding='latin-1', sep=None, engine='python', dtype=str)
        except Exception as e:
            raise Exception(f"No se pudo leer el archivo: {str(e)}")

    # 2. NORMALIZAR NOMBRES DE COLUMNAS
    if df.empty:
        return 0, 0
        
    df.columns = df.columns.str.lower().str.strip().str.replace('ó', 'o').str.replace('é', 'e').str.replace('í', 'i')

    # 3. MAPEO DE COLUMNAS
    # Buscamos columnas que "parezcan" ser lo que buscamos
    
    # Nombre
    col_nombre = next((c for c in df.columns if c in ['nombre', 'name', 'nombre y apellido', 'apenom', 'full name']), None)
    
    # DNI (Notes en Google Contacts a veces, o columna explicita)
    col_dni = next((c for c in df.columns if c in ['dni', 'documento', 'cuil', 'cuit', 'id', 'notes', 'notas']), None)
    
    # Celular/Telefono
    col_celular = next((c for c in df.columns if c in ['celular', 'cel', 'telefono', 'tel', 'movil', 'phone', 'phone 1 - value', 'mobile phone']), None)
    
    # Email
    col_email = next((c for c in df.columns if c in ['mail', 'email', 'correo', 'e-mail', 'e-mail 1 - value']), None)
    
    # Tag (Organization en Google)
    col_tag = next((c for c in df.columns if c in ['tag', 'etiqueta', 'organization', 'organization 1 - name', 'empresa']), None)

    # 4. LIMPIEZA DE DATOS
    df = df.fillna('')
    
    registros_a_crear = []
    contactos_a_actualizar = []
    
    # Cacheamos celulares existentes para saber si crear o actualizar
    contactos_existentes = {c.celular: c for c in Contacto.objects.all()} # Obtenemos todos para chequear en memoria (cuidado con memoria si son millones)
    # Si son muchos, mejor hacer consultas batch, pero para <10k sirve.

    # Iteramos filas
    for index, row in df.iterrows():
        # Extraccion
        nombre = row[col_nombre].strip() if col_nombre else "Sin Nombre"
        
        # Limpieza Celular
        raw_cel = row[col_celular] if col_celular else ""
        celular_limpio = ''.join(filter(str.isdigit, str(raw_cel)))
        
        # Validación mínima celular
        if not celular_limpio:
            continue

        # Limpieza DNI
        raw_dni = row[col_dni] if col_dni else ""
        # Si la columna es 'notes' o 'notas', buscamos el patrón "DNI: xxxx" similar al front
        dni_limpio = ""
        if col_dni in ['notes', 'notas']:
            import re
            match = re.search(r'DNI:\s*([\d\.]+)', raw_dni, re.IGNORECASE)
            if match:
                dni_limpio = match.group(1).replace('.', '')
        else:
            dni_limpio = ''.join(filter(str.isdigit, str(raw_dni)))

        email = row[col_email].strip().lower() if col_email else ""
        
        # Tag
        # Si el usuario mandó un tag explícito en el form, usamos ese preferentemente si el row no tiene
        # O la logica que pidió el usuario: "cambiar el tag por default es importado pero capas le quiere poner otro"
        # Asumiré: Si hay columna Organization, se usa esa. Si no, se usa el parametro 'tag'.
        # O podemos concatenar.
        
        row_tag_val = row[col_tag].strip() if col_tag else ""
        tag_final = tag if tag else (row_tag_val if row_tag_val else "importado")

        # Crear instancia
        if celular_limpio in contactos_existentes:
            # Actualizar existente? 
            # El usuario no especificó politica de actualización, pero el código anterior daba 'actualizados'.
            # Asumiremos update de campos vacíos o sobrescritura? 
            # Mejor sobrescritura simple de campos que traigamos.
            
            c = contactos_existentes[celular_limpio]
            changed = False
            
            if nombre and nombre != "Sin Nombre" and c.nombre != nombre:
                c.nombre = nombre
                changed = True
            if email and c.email != email:
                c.email = email
                changed = True
            if dni_limpio and c.dni != dni_limpio:
                c.dni = dni_limpio
                changed = True
            if tag_final and c.tag != tag_final:
                c.tag = tag_final
                changed = True
                
            if changed:
                contactos_a_actualizar.append(c)
        else:
            # Crear nuevo
            nuevo = Contacto(
                nombre=nombre[:255],
                celular=celular_limpio[:20],
                email=email,
                dni=dni_limpio[:20],
                tag=tag_final[:50]
            )
            registros_a_crear.append(nuevo)
            contactos_existentes[celular_limpio] = nuevo # Evitar duplicados en el mismo CSV

    # 5. GUARDADO MASIVO
    with transaction.atomic():
        if registros_a_crear:
            Contacto.objects.bulk_create(registros_a_crear, batch_size=1000)
        
        if contactos_a_actualizar:
            Contacto.objects.bulk_update(contactos_a_actualizar, ['nombre', 'email', 'dni', 'tag'], batch_size=1000)

    return len(df), len(registros_a_crear)
