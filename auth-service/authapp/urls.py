from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(),   name='register'),
    path('login/',    views.login_view,                name='login'),
    path('logout/',   views.logout_view,               name='logout'),
    path('refresh/',  TokenRefreshView.as_view(),      name='token-refresh'),
    path('verify/',   views.verify_token_view,         name='verify-token'),
    path('me/',       views.MeView.as_view(),          name='me'),
    path('users/',    views.UserListView.as_view(),    name='user-list'),
]
