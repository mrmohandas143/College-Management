from rest_framework import serializers
from .models import HostelBlock, Room, HostelAllotment, HostelFee, Visitor, LeaveRequest, HostelComplaint, HostelApplication, HostelAttendance


class HostelBlockSerializer(serializers.ModelSerializer):
    class Meta: model = HostelBlock; fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
    block_name = serializers.CharField(source='block.name', read_only=True)
    class Meta: model = Room; fields = '__all__'


class HostelAllotmentSerializer(serializers.ModelSerializer):
    room_info = serializers.CharField(source='room.__str__', read_only=True)
    class Meta: model = HostelAllotment; fields = '__all__'


class HostelFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='allotment.student_name', read_only=True)
    room_info    = serializers.CharField(source='allotment.room.__str__', read_only=True)
    class Meta: model = HostelFee; fields = '__all__'


class VisitorSerializer(serializers.ModelSerializer):
    class Meta: model = Visitor; fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    room_info = serializers.CharField(source='room.__str__', read_only=True)
    class Meta: model = LeaveRequest; fields = '__all__'


class HostelComplaintSerializer(serializers.ModelSerializer):
    class Meta: model = HostelComplaint; fields = '__all__'


class HostelApplicationSerializer(serializers.ModelSerializer):
    preferred_block_name = serializers.CharField(source='preferred_block.name', read_only=True)
    class Meta: model = HostelApplication; fields = '__all__'


class HostelAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='allotment.student_name', read_only=True)
    room_info    = serializers.CharField(source='allotment.room.__str__', read_only=True)
    class Meta: model = HostelAttendance; fields = '__all__'
