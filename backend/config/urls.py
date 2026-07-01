from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/vendors/',include('vendors.urls')),
    path('api/dashboard/',include('dashboard.urls')),
    path('api/alerts/',include('alerts.urls')),
    path("api/apis/",include("api_security.urls")),
    path( "api/graph/", include("graph.urls")),
    path("api/ai/", include("enterprise_ai.urls")),
]

# Auto-migrate and import API inventory on startup
import os
from django.core.management import call_command

try:
    print("Auto-running migrations...")
    call_command('makemigrations', 'api_security')
    call_command('migrate')
    print("Auto-running import_api_inventory...")
    call_command('import_api_inventory')
    print("Auto-migration and import completed successfully.")
except Exception as e:
    print("Failed to auto-run migrations/import on startup:", e)
