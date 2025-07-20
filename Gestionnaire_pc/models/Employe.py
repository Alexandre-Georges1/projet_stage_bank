from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.crypto import get_random_string



class Employe(models.Model):
    id_employe = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    login = models.CharField(max_length=200, blank=True,default="employe.nouveau")
    mot_de_passe = models.CharField(max_length=128,default="password123")
    matricule = models.CharField(max_length=50, unique=True)
    telephone = models.CharField(max_length=20, unique=True)
    Département = models.CharField(max_length=191)
    date_embauche = models.DateField()
    fonction = models.CharField(max_length=50)
    email= models.EmailField(max_length=50,blank=True, default="employe@gmail.com")


class EmployeDOT(models.Model):
    employe = models.OneToOneField(Employe, on_delete=models.CASCADE, primary_key=True, related_name="employe_dot")
    DOT_code = models.CharField(max_length=8, unique=True)

class EmployeMGX(models.Model):
    employe = models.OneToOneField(Employe, on_delete=models.CASCADE, primary_key=True, related_name="employe_mgx")
    MGX_code = models.CharField(max_length=8, unique=True)

class EmployeDCH(models.Model):
    employe = models.OneToOneField(Employe, on_delete=models.CASCADE, primary_key=True, related_name="employe_dch")
    DCH_code = models.CharField(max_length=8, unique=True)

class EmployeRMG(models.Model):
    employe = models.OneToOneField(Employe, on_delete=models.CASCADE, primary_key=True, related_name="employe_rmg")
    RMG_code = models.CharField(max_length=8, unique=True)

class EmployeRDAF(models.Model):
    employe = models.OneToOneField(Employe, on_delete=models.CASCADE, primary_key=True, related_name="employe_rdaf")
    RDAF_code = models.CharField(max_length=8, unique=True)

class EmployeRDOT(models.Model):
    employe = models.OneToOneField(Employe, on_delete=models.CASCADE, primary_key=True, related_name="employe_rdot")
    RDOT_code = models.CharField(max_length=8, unique=True)


@receiver(post_save, sender=Employe)
def create_employe_special(sender, instance, created, **kwargs):
    if created:
        fonction = instance.fonction.strip().lower()
        code = get_random_string(8).upper()

        if fonction == 'dot':
            EmployeDOT.objects.create(employe=instance, DOT_code=code)
        elif fonction == 'mgx':
            EmployeMGX.objects.create(employe=instance, MGX_code=code)
        elif fonction == 'dch':
            EmployeDCH.objects.create(employe=instance, DCH_code=code)
        elif fonction == 'rmg':
            EmployeRMG.objects.create(employe=instance, RMG_code=code)
        elif fonction == 'rdaf':
            EmployeRDAF.objects.create(employe=instance, RDAF_code=code)
        elif fonction == 'rdot':
            EmployeRDOT.objects.create(employe=instance, RDOT_code=code)
