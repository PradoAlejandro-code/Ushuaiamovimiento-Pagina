from import_export import resources, fields
from enrollments.models import Enrollee

class EnrolleeResource(resources.ModelResource):
    # Mapeamos explícitamente los campos físicos del modelo
    enrollment_list_id = fields.Field(column_name='enrollment_list_id', attribute='enrollment_list_id')
    dynamic_data = fields.Field(column_name='dynamic_data', attribute='dynamic_data')

    class Meta:
        model = Enrollee
        fields = ('enrollment_list_id', 'dynamic_data')
        use_bulk = True
        batch_size = 5000  # Tamaño óptimo para inserción SQL masiva

    def before_import_row(self, row, **kwargs):
        # 1. Tomamos el ID del padrón que enviamos desde la vista
        row['enrollment_list_id'] = kwargs.get('enrollment_list_id')
        
        # 2. Copiamos toda la fila (los 95 headers del CSV) y la guardamos en dynamic_data
        original_row = row.copy()
        
        # Opcional: limpiar la propia key para no duplicar datos, aunque no afecta
        original_row.pop('enrollment_list_id', None)
        
        row['dynamic_data'] = original_row