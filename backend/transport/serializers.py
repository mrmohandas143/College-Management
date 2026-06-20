from rest_framework import serializers
from .models import Route, Vehicle, TransportAllotment

class RouteSerializer(serializers.ModelSerializer):
    vehicle_count = serializers.SerializerMethodField()
    def get_vehicle_count(self, obj): return obj.vehicles.count()
    class Meta: model = Route; fields = '__all__'

class VehicleSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source='route.name', read_only=True)
    class Meta: model = Vehicle; fields = '__all__'

class TransportAllotmentSerializer(serializers.ModelSerializer):
    route_name   = serializers.CharField(source='route.name', read_only=True)
    vehicle_reg  = serializers.CharField(source='vehicle.reg_number', read_only=True)
    class Meta: model = TransportAllotment; fields = '__all__'
