from django.db import models
from .pc import PC


class Pc_ancien(models.Model):
    id_ancien = models.AutoField(primary_key=True)
    pc = models.ForeignKey(PC, on_delete=models.CASCADE)
    date_ajout = models.DateField(auto_now_add=True)