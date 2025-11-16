from rest_framework import permissions
from .models import Agent


class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to edit it.
    Assumes the model instance has an `agent` or `created_by` attribute.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the object or an admin/manager
        user = request.user
        
        # Admins and Sales Managers have full access
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return True
        
        # Check if user is the owner (agent or created_by)
        if hasattr(obj, 'agent'):
            return obj.agent == user
        if hasattr(obj, 'created_by'):
            return obj.created_by == user
        
        return False


class IsAdminOrManager(permissions.BasePermission):
    """Permission to only allow admins and managers"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.is_staff or
            request.user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]
        )


class IsAdminOnly(permissions.BasePermission):
    """Permission to only allow admins"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_staff or request.user.role == Agent.Role.ADMIN

