from waitress import serve
from gestion_pc.wsgi import application
print("Démarrage du serveur...")
serve(application, host="0.0.0.0", port=8000,threads=8)