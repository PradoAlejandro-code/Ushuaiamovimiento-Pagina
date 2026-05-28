from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import RespuestaHeader, RespuestaDetalle, Pregunta
from contact.models import Contacto
import re

@receiver(post_save, sender=RespuestaHeader)
def procesar_contacto_signal(sender, instance, **kwargs):
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

    for detalle in header.detalles.all():
        tipo_pregunta = detalle.pregunta.tipo
        val = detalle.valor_texto
        if not val and detalle.valor_numero is not None:
            val = str(detalle.valor_numero) 
        
        if not val: 
            continue
        if tipo_pregunta == Pregunta.TIPO_NOMBRE:
            nombre_extraido = val
        elif tipo_pregunta == Pregunta.TIPO_CELULAR or tipo_pregunta == Pregunta.TIPO_TELEFONO:
            limpio = re.sub(r'[^\d+]', '', str(val))
            if limpio:
                tel_extraido = limpio
        elif tipo_pregunta == Pregunta.TIPO_MAIL:
            email_extraido = val
        elif tipo_pregunta == Pregunta.TIPO_DNI:
            dni_extraido = val

    if tel_extraido:
        tel_extraido = tel_extraido[:20]
        
        try:
            defaults = {
                'nombre': nombre_extraido if nombre_extraido else "Sin Nombre",
            }
            if email_extraido:
                defaults['email'] = email_extraido
            if dni_extraido:
                defaults['dni'] = dni_extraido

            contacto, created = Contacto.objects.update_or_create(
                celular=tel_extraido,
                defaults=defaults
            )
          
            if header.contacto != contacto:
                header.contacto = contacto
                header.save(update_fields=['contacto'])
                
            nuevos_tags = []
            if header.seccion:
                nuevos_tags.append(header.seccion)
            if header.barrio:
                nuevos_tags.append(header.barrio)
            if header.encuesta and header.encuesta.nombre:
                nuevos_tags.append(header.encuesta.nombre)
                
            if nuevos_tags:
                contacto.tag = ", ".join([nt.strip() for nt in nuevos_tags])
                contacto.save(update_fields=['tag'])

        except Exception as e:
            print(f"Error procesando contacto en signal: {e}")
            pass
