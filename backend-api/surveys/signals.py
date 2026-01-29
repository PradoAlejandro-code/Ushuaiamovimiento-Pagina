from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import RespuestaHeader, Contacto, RespuestaDetalle, Pregunta
import re

@receiver(post_save, sender=RespuestaHeader)
def procesar_contacto_signal(sender, instance, **kwargs):
    # Ya no procesamos en el header save directamente porque esperamos a los detalles,
    # pero si queremos soportar actualizaciones que vengan del header, podríamos llamar a procesar_header
    # Dejamos el pass o llamamos si es update.
    # En la practica, el procesamiento real lo disparará el detalle.
    pass

@receiver(post_save, sender=RespuestaDetalle)
def actualizar_contacto_desde_detalle(sender, instance, **kwargs):
    header = instance.header
    procesar_header(header)

def procesar_header(header):
    nombre_extraido = None
    tel_extraido = None
    email_extraido = None
    dni_extraido = None

    # Recorremos todos los detalles actuales del header
    for detalle in header.detalles.all():
        tipo_pregunta = detalle.pregunta.tipo
        val = detalle.valor_texto
        if not val and detalle.valor_numero is not None:
            val = str(detalle.valor_numero) # Convertimos numero a string si hace falta
        
        if not val: 
            continue
            
        # Extracción directa basada en el tipo de pregunta
        if tipo_pregunta == Pregunta.TIPO_NOMBRE:
            nombre_extraido = val
        elif tipo_pregunta == Pregunta.TIPO_CELULAR or tipo_pregunta == Pregunta.TIPO_TELEFONO:
             # Limpieza básica de números
            limpio = re.sub(r'[^\d+]', '', str(val))
            if limpio:
                tel_extraido = limpio
        elif tipo_pregunta == Pregunta.TIPO_MAIL:
            email_extraido = val
        elif tipo_pregunta == Pregunta.TIPO_DNI:
            dni_extraido = val

    # Solo si tenemos un celular (identificador unico) procesamos el contacto
    if tel_extraido:
        defaults = {
            'nombre': nombre_extraido if nombre_extraido else "Sin Nombre",
        }
        if email_extraido:
            defaults['email'] = email_extraido
        if dni_extraido:
            defaults['dni'] = dni_extraido

        # update_or_create busca por celular
        contacto, created = Contacto.objects.update_or_create(
            celular=tel_extraido,
            defaults=defaults
        )
        
        # Vinculamos al header si no estaba
        if header.contacto != contacto:
            header.contacto = contacto
            header.save(update_fields=['contacto'])
