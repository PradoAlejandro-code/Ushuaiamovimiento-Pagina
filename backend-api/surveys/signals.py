from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import RespuestaHeader, Contacto
import re

@receiver(post_save, sender=RespuestaHeader)
def procesar_contacto_heuristico(sender, instance, **kwargs):
    # Palabras clave para la búsqueda heurística
    # Incluimos 'nombre completo' explícitamente por si acaso, aunque 'nombre' ya lo cubriría, pero heurística más específica ayuda
    keywords_nombre = ['nombre', 'apellido', 'completo', 'usuario', 'nombres', 'apellidos']
    keywords_tel = ['tel', 'cel', 'contacto', 'whatsapp', 'numero', 'movil', 'telf']

    nombre_extraido = None
    tel_extraido = None

    # Recorremos los detalles de la respuesta
    # Nota: post_save de Header se dispara al crear el header, pero los detalles se guardan después.
    # Esta señal podría dispararse antes de tener detalles si no tenemos cuidado.
    # EN DRF (Serializer), el create() suele guardar header y luego detalles.
    # Si esta señal corre inmediatamente tras el save() del header, instance.detalles.all() estará vacío en creación.
    # SOLUCIÓN: Usar un signal en RespuestaDetalle o llamar a una función explícita desde el Serializer.
    # PERO, el usuario pidió Signal. 
    # Si es actualización (created=False), los detalles ya existen.
    # Si es creación, esperamos que el serializer haga algo o que los detalles disparen esto.
    
    # ESTRATEGIA: Vamos a conectar también a RespuestaDetalle.post_save para que actualice el header->contacto
    
    pass

# Mejor estrategia: Signal en Detalle que actualice al Padre
from .models import RespuestaDetalle

@receiver(post_save, sender=RespuestaDetalle)
def actualizar_contacto_desde_detalle(sender, instance, **kwargs):
    header = instance.header
    procesar_header(header)

def procesar_header(header):
    keywords_nombre = ['nombre', 'apellido', 'completo', 'usuario', 'nombres', 'apellidos']
    keywords_tel = ['tel', 'cel', 'contacto', 'whatsapp', 'numero', 'movil', 'telf']

    nombre_extraido = None
    tel_extraido = None

    # Recorremos todos los detalles actuales del header
    for detalle in header.detalles.all():
        titulo = detalle.pregunta.titulo.lower()
        val = detalle.valor_texto
        if not val and detalle.valor_numero is not None:
            val = str(detalle.valor_numero)
        
        if not val: 
            continue

        # Heurística Nombre (Prioridad a concatenar si hay varios?)
        # Simplificación: Tomamos el primero que machee o concatenamos si detectamos nombre y apellido por separado
        if any(key in titulo for key in keywords_nombre):
            if not nombre_extraido:
                nombre_extraido = val
            else:
                nombre_extraido += f" {val}"
        
        # Heurística Teléfono
        if any(key in titulo for key in keywords_tel):
            # Limpieza básica de números
            limpio = re.sub(r'[^\d+]', '', str(val))
            if limpio:
                tel_extraido = limpio

    if tel_extraido:
        # update_or_create busca por celular
        contacto, created = Contacto.objects.update_or_create(
            celular=tel_extraido,
            defaults={
                'nombre': nombre_extraido if nombre_extraido else "Sin Nombre",
                # No sobreescribimos tag si ya existe, o sí? El usuario dijo "tag default encuesta" al crear
                # Si ya existe, mantenemos el que tiene o actualizamos?
                # "defaults" solo se usa si se crea o si se actualiza. 
                # Si queremos preservar el tag existente en updates, deberíamos sacarlo de defaults si existe.
                # Pero simple: Mantenemos 'encuesta' por defecto si se crea.
            }
        )
        
        # Vinculamos si no estaba
        if header.contacto != contacto:
            header.contacto = contacto
            header.save(update_fields=['contacto'])
