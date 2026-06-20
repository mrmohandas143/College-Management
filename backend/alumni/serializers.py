from rest_framework import serializers
from .models import AlumniProfile, AlumniEvent, AlumniEventRegistration

class AlumniProfileSerializer(serializers.ModelSerializer):
    class Meta: model = AlumniProfile; fields = '__all__'

class AlumniEventSerializer(serializers.ModelSerializer):
    registrations_count = serializers.SerializerMethodField()
    def get_registrations_count(self, obj): return obj.registrations.count()
    class Meta: model = AlumniEvent; fields = '__all__'

class AlumniEventRegistrationSerializer(serializers.ModelSerializer):
    alumni_name  = serializers.CharField(source='alumni.__str__', read_only=True)
    event_title  = serializers.CharField(source='event.title', read_only=True)
    class Meta: model = AlumniEventRegistration; fields = '__all__'
