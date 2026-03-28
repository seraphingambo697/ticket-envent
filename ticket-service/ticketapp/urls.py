from django.urls import path
from . import views

urlpatterns = [
    path('',          views.TicketList.as_view(),  name='ticket-list'),
    path('purchase/', views.purchase,              name='ticket-purchase'),
    path('<uuid:pk>/',views.TicketDetail.as_view(),name='ticket-detail'),
]
