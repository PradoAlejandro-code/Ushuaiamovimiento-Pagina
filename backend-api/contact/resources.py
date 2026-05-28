from import_export import resources, fields
from .models import Contacto

class ContactoResource(resources.ModelResource):
    nombre = fields.Field(attribute='nombre')
    dni = fields.Field(attribute='dni')
    celular = fields.Field(attribute='celular')
    email = fields.Field(attribute='email')
    tag = fields.Field(attribute='tag')

    class Meta:
        model = Contacto
        import_id_fields = ('celular',)
        fields = ('nombre', 'dni', 'celular', 'email', 'tag')

    def before_import_row(self, row, **kwargs):
        if 'celular' in row:
            row['celular'] = ''.join(filter(str.isdigit, str(row['celular'])))
        
        if 'dni' in row:
            row['dni'] = ''.join(filter(str.isdigit, str(row['dni'])))
            
        if not row.get('tag'):
            row['tag'] = kwargs.get('default_tag', 'importado')