# Usamos Python liviano
FROM python:3.14-alpine

# Evita que Python guarde archivos caché (.pyc) y muestra los logs al instante
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Carpeta de trabajo adentro del contenedor
WORKDIR /app

# Instalamos las librerías
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo tu código
COPY . .

# Exponemos el puerto 8000 (el clásico de Django)
EXPOSE 8000

# Comando para iniciar (usamos Gunicorn que es profesional)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]