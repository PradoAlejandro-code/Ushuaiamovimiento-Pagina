from django.core.management.base import BaseCommand
from surveys.models import RespuestaHeader, RespuestaDetalle, RespuestaFoto, Foto
from django.db import transaction

class Command(BaseCommand):
    help = 'Migra las fotos existentes al nuevo modelo centralizado Foto'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando migración de fotos...")
        
        count_creadas = 0
        
        # Iteramos sobre todas las respuestas (headers) para tener el contexto (barrio, seccion, encuesta)
        headers = RespuestaHeader.objects.all()
        total_headers = headers.count()
        
        self.stdout.write(f"Procesando {total_headers} respuestas...")

        with transaction.atomic():
            for i, header in enumerate(headers):
                if i % 100 == 0:
                    self.stdout.write(f"Procesando respuesta {i}/{total_headers}")

                # Contexto común
                encuesta_id = header.encuesta_id
                respuesta_id = header.id
                barrio = header.barrio
                seccion = header.seccion
                fecha = header.fecha_envio

                # Buscamos detalles de esta respuesta
                detalles = header.detalles.all()
                
                for detalle in detalles:
                    # 1. Chequear valor_foto (Legacy/Simple)
                    if detalle.valor_foto:
                        Foto.objects.create(
                            archivo=detalle.valor_foto,
                            respuesta_id=respuesta_id,
                            encuesta_id=encuesta_id,
                            barrio=barrio,
                            seccion=seccion,
                            fecha=fecha
                        )
                        count_creadas += 1

                    # 2. Chequear RespuestaFoto (Multiple)
                    fotos_extra = detalle.fotos_extra.all()
                    for foto_extra in fotos_extra:
                        if foto_extra.imagen:
                            Foto.objects.create(
                                archivo=foto_extra.imagen,
                                respuesta_id=respuesta_id,
                                encuesta_id=encuesta_id,
                                barrio=barrio,
                                seccion=seccion,
                                fecha=fecha
                            )
                            count_creadas += 1

        self.stdout.write(self.style.SUCCESS(f'Migración completada. Se crearon {count_creadas} registros en Foto.'))
