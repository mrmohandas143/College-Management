from rest_framework import serializers
from .models import Company, PlacementDrive, PlacementApplication

class CompanySerializer(serializers.ModelSerializer):
    class Meta: model = Company; fields = '__all__'

class PlacementDriveSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    applications_count = serializers.SerializerMethodField()
    selected_count     = serializers.SerializerMethodField()
    def get_applications_count(self, obj): return obj.applications.count()
    def get_selected_count(self, obj):     return obj.applications.filter(status='selected').count()
    class Meta: model = PlacementDrive; fields = '__all__'

class PlacementApplicationSerializer(serializers.ModelSerializer):
    drive_title  = serializers.CharField(source='drive.title', read_only=True)
    company_name = serializers.CharField(source='drive.company.name', read_only=True)
    class Meta: model = PlacementApplication; fields = '__all__'
