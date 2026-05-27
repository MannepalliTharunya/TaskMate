from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls.auth_urls')),
    path('api/', include('api.urls.task_urls')),
    path('api/', include('api.urls.document_urls')),
    path('api/', include('api.urls.search_urls')),
    path('api/', include('api.urls.analytics_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
