from django.apps import AppConfig


class GestionnairePcConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Gestionnaire_pc'

    def ready(self):
        # Import des signaux pour activer les receivers au démarrage de Django
        try:
            import Gestionnaire_pc.signals  # noqa: F401
        except Exception:
            # Évite de casser le chargement si des migrations manipulent les modèles
            pass
