from django.core.management.base import BaseCommand
from surveys.models import RespuestaHeader

class Command(BaseCommand):
    help = 'Actualiza los tags de los contactos existentes usando los datos de las encuestas (sección y barrio).'

    def handle(self, *args, **kwargs):
        headers = RespuestaHeader.objects.select_related('contacto', 'encuesta').all()
        actualizados = 0
        errores = 0

        self.stdout.write(self.style.WARNING("Iniciando la actualización de tags para contactos..."))

        for header in headers:
            contacto = header.contacto
            if not contacto:
                continue

            nuevos_tags = []
            if header.seccion:
                nuevos_tags.append(header.seccion.strip())
            if header.barrio:
                nuevos_tags.append(header.barrio.strip())

            if not nuevos_tags:
                continue

            nuevo_tag_str = ", ".join(nuevos_tags)

            if contacto.tag != nuevo_tag_str:
                contacto.tag = nuevo_tag_str
                try:
                    contacto.save(update_fields=['tag'])
                    actualizados += 1
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Error guardando tags para {contacto}: {e}"))
                    errores += 1

        self.stdout.write(self.style.SUCCESS(f"Finalizado. Se actualizaron {actualizados} contactos."))
        if errores:
            self.stdout.write(self.style.ERROR(f"Hubo {errores} errores intermedios."))
