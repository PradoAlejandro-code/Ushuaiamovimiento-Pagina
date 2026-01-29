#!/bin/bash

# --- CONFIGURA EL NOMBRE DE TU IMAGEN AQUÍ ---
IMAGE_NAME="bellcep/backend-api"
# ---------------------------------------------

FILE_NAME="VERSION"

# 1. Verificar si existe el archivo de versión
if [ ! -f "$FILE_NAME" ]; then
    echo "❌ Error: No existe el archivo 'VERSION'."
    echo "Créalo ejecutando: echo '0.0.0' > VERSION"
    exit 1
fi

# 2. Leer la versión actual
CURRENT_VERSION=$(cat "$FILE_NAME")

echo "========================================"
echo "📦 Procesando versión: $CURRENT_VERSION"
echo "========================================"

# 3. Construir la imagen (Docker Build)
echo "🔨 Construyendo imagen..."
# Construimos la versión específica
sudo docker build -t "$IMAGE_NAME:$CURRENT_VERSION" .

# --- CAMBIO IMPORTANTE: Etiquetamos también como 'latest' ---
sudo docker tag "$IMAGE_NAME:$CURRENT_VERSION" "$IMAGE_NAME:latest"

if [ $? -ne 0 ]; then
    echo "❌ Falló el Build. Revisa errores arriba."
    exit 1
fi

# 4. Subir la imagen (Docker Push)
echo "☁️  Subiendo a Docker Hub..."

# Subimos la versión histórica (ej: 0.0.1)
sudo docker push "$IMAGE_NAME:$CURRENT_VERSION"

# --- CAMBIO IMPORTANTE: Subimos la etiqueta 'latest' ---
echo "☁️  Actualizando etiqueta 'latest'..."
sudo docker push "$IMAGE_NAME:latest"

if [ $? -ne 0 ]; then
    echo "❌ Falló el Push. ¿Estás logueado? (sudo docker login)"
    exit 1
fi

echo "✅ Versión $CURRENT_VERSION y 'latest' subidas correctamente."

# 5. Calcular la SIGUIENTE versión (Incrementar el último número)
IFS='.' read -r -a parts <<< "$CURRENT_VERSION"
MAJOR=${parts[0]}
MINOR=${parts[1]}
PATCH=${parts[2]}

# Sumamos 1 al parche
NEW_PATCH=$((PATCH + 1))
NEXT_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

# 6. Guardar la nueva versión en el archivo
echo "$NEXT_VERSION" > "$FILE_NAME"

echo "========================================"
echo "⏭️  Lista para la próxima: $NEXT_VERSION"
echo "========================================"