from django.db import models

class User(models.Model):
    name = models.CharField(max_length=300)
    surname = models.CharField(max_length=300)
    email = models.EmailField()

    def __unicode__(self):
        return self.name
    
    class Meta:
        ordering = ['name']