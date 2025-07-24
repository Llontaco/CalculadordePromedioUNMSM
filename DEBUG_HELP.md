# Archivo de Prueba para Debug

Este es un archivo de ayuda para debugear el sistema de extracción de PDF.

## Patrones que el sistema busca:

1. **Códigos de curso**: INO101, INO102, 202SW0103, etc.
2. **Formato esperado**: CODIGO - NOMBRE_CURSO NOTA CREDITOS
3. **Períodos**: 2023-0, 2023-1, 2024-0, etc.

## Ejemplo de líneas que deberían funcionar:

```
2023-1
INO101 - REDACCIÓN Y COMUNICACIÓN I 15 3
INO102 - MÉTODOS DE ESTUDIO 17 2
202SW0103 - DESARROLLO PERSONAL 16 2

2024-0
202SW0301 - ALGORÍTMICA I 12 4
202SW0302 - ESTADÍSTICA 14 4
```

## Para probar:

1. Sube un PDF con formato similar al historial de UNMSM
2. Revisa la consola del navegador (F12) para ver los logs de debug
3. Si no funciona, verifica que el PDF tenga texto extraíble (no sea imagen escaneada)

## Posibles problemas:

- PDF es una imagen escaneada (sin texto extraíble)
- Formato del historial no coincide con los patrones
- Caracteres especiales en los nombres de cursos
- Espaciado diferente entre campos
