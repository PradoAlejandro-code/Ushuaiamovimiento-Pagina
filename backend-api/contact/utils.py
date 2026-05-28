import pandas as pd
from tablib import Dataset
from .resources import ContactoResource

def importar_contactos_inteligente(archivo_csv, tag=None):
    try:
        df = pd.read_csv(archivo_csv, encoding_errors='ignore', dtype=str)
    except Exception:
        archivo_csv.seek(0)
        df = pd.read_csv(archivo_csv, encoding='latin-1', dtype=str)

    if df.empty:
        return 0, 0

    mapeo = {
        'nombre': ['nombre', 'name', 'nombre y apellido', 'apenom', 'full name'],
        'dni': ['dni', 'documento', 'id', 'notes', 'notas'],
        'celular': ['celular', 'cel', 'telefono', 'tel', 'movil', 'phone', 'phone 1 - value'],
        'email': ['mail', 'email', 'correo', 'e-mail', 'e-mail 1 - value'],
        'tag': ['tag', 'etiqueta', 'organization', 'empresa']
    }

    new_cols = {}
    for col in df.columns:
        clean_col = col.lower().strip()
        for field, aliases in mapeo.items():
            if clean_col in aliases:
                new_cols[col] = field
    
    df.rename(columns=new_cols, inplace=True)

    dataset = Dataset().load(df)
    resource = ContactoResource()
    
    result = resource.import_data(dataset, dry_run=False, default_tag=tag)

    return len(df), result.totals['new'] + result.totals['update']