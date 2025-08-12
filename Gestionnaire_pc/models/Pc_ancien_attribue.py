from django.db import models
from .Pc_ancien import Pc_ancien
from .Employe import Employe


class Pc_ancien_attribue(models.Model):
    id_attribue_ancien = models.AutoField(primary_key=True)
    pc_ancien = models.ForeignKey(Pc_ancien, on_delete=models.CASCADE, related_name='attributions')
    employe = models.ForeignKey(Employe, on_delete=models.SET_NULL, null=True, blank=True, related_name='pc_anciens_attribues')
    date_attribution = models.DateField()
    date_fin_attribution = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        emp = f"{self.employe.prenom} {self.employe.nom}" if self.employe else "(inconnu)"
        return f"{self.pc_ancien.numero_serie} → {emp} ({self.date_attribution})"
