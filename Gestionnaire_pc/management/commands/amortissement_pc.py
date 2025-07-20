from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from Gestionnaire_pc.models import PC, Pc_ancien

class Command(BaseCommand):
    help = "Déplace les PC amortis (plus de 4 ans) dans Pc_ancien et les supprime de PC."

    def handle(self, *args, **options):
        aujourd_hui = timezone.now().date()
        pcs = PC.objects.all()
        moved = 0
        for pc in pcs:
            if pc.date_achat and (pc.date_achat + timedelta(days=4*365) <= aujourd_hui):
                Pc_ancien.objects.create(pc=pc)
                self.stdout.write(self.style.SUCCESS(f"PC {pc.id_pc} déplacé dans Pc_ancien."))
                pc.delete()
                moved += 1
        if moved == 0:
            self.stdout.write(self.style.WARNING("Aucun PC à amortir."))
        else:
            self.stdout.write(self.style.SUCCESS(f"{moved} PC(s) amorti(s) et déplacé(s)."))
