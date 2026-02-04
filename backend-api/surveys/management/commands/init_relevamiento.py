from django.core.management.base import BaseCommand
from surveys.models import Encuesta, Pregunta

class Command(BaseCommand):
    help = 'Inicializa el Relevamiento por defecto'

    def handle(self, *args, **options):
        relevamiento, created = Encuesta.objects.get_or_create(
            es_relevamiento=True,
            defaults={
                'nombre': 'Relevamiento General',
                'descripcion': '',
                'requiere_ubicacion': True,
                'activo': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Relevamiento creado: {relevamiento.nombre}'))
            # Crear preguntas básicas por defecto
            Pregunta.objects.create(encuesta=relevamiento, titulo='Nombre Completo', orden=1, tipo='nombre')
        else:
            self.stdout.write(self.style.WARNING(f'El Relevamiento ya existe: {relevamiento.nombre}'))
            # Asegurar que requiera ubicación
            if not relevamiento.requiere_ubicacion:
                relevamiento.requiere_ubicacion = True
                relevamiento.save()
                self.stdout.write(self.style.SUCCESS('Se actualizó para requerir ubicación.'))
