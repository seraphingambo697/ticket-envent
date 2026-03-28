from django.urls import path
from . import views

urlpatterns = [
    path('',                views.EventListCreate.as_view(), name='event-list'),
    path('<uuid:pk>/',      views.EventDetail.as_view(),     name='event-detail'),
    path('<uuid:pk>/seats/',views.EventSeatsUpdate.as_view(),name='event-seats'),
]
