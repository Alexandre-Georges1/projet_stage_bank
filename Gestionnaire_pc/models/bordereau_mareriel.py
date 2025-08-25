from django.db import models
from .Bordereau import Bordereau

class BordereauMateriel(models.Model):
    id_materiel = models.AutoField(primary_key=True)
    bordereau = models.ForeignKey(Bordereau, on_delete=models.CASCADE, related_name='materiels')
    materiel = models.CharField(max_length=255)
    numero_serie = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    quantite = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)