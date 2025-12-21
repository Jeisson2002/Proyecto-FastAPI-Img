import subprocess
from fastapi import HTTPException

def restart_container(container_name: str):
    try:
        # Reinicia el contenedor usando Docker CLI
        subprocess.run(["docker", "restart", container_name], check=True)
        return {"message": f"Contenedor '{container_name}' reiniciado correctamente"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fallo al reiniciar el contenedor: {str(e)}"
        )
