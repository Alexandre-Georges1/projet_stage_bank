from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from Gestionnaire_pc.models import PC, Pc_ancien, Pc_attribué

class Command(BaseCommand):
    help = "Déplace les PC amortis (plus de 4 ans) dans Pc_ancien et les supprime de PC."

    def handle(self, *args, **options):
        aujourd_hui = timezone.now().date()
        pcs = PC.objects.all()
        moved = 0
        for pc in pcs:
            if pc.date_achat and (pc.date_achat + timedelta(days=4*365) <= aujourd_hui):
                Pc_ancien.objects.create(
                    marque=pc.marque.nom_marque,
                    modele=pc.modele.nom_modele,
                    numero_serie=pc.numero_serie,
                    processeur=pc.processeur,
                    ram=pc.ram,
                    disque_dur=pc.disque_dur,
                    date_achat=pc.date_achat,
                )
                self.stdout.write(self.style.SUCCESS(f"PC {pc.id_pc} déplacé dans Pc_ancien."))
                pc.delete()
                moved += 1
        # PCs attribués basés sur date d'attribution
        for pa in Pc_attribué.objects.all():
            if pa.date_attribution and (pa.date_attribution + timedelta(days=4*365) <= aujourd_hui):
                Pc_ancien.objects.create(
                    marque=pa.marque,
                    modele=pa.modele,
                    numero_serie=pa.numero_serie,
                    processeur=pa.processeur,
                    ram=pa.ram,
                    disque_dur=pa.disque_dur,
                    date_achat=pa.date_achat,
                    employe=pa.employe,
                )
                self.stdout.write(self.style.SUCCESS(f"PC attribué {pa.id_attribue} déplacé dans Pc_ancien."))
                pa.delete()
                moved += 1
        if moved == 0:
            self.stdout.write(self.style.WARNING("Aucun PC à amortir."))
        else:
            self.stdout.write(self.style.SUCCESS(f"{moved} PC(s) amorti(s) et déplacé(s)."))
