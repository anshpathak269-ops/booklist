from django.urls import path
from . import views

urlpatterns = [
    path('books/', views.book_collection, name='book_collection'),
    path('books/<int:pk>/', views.book_detail, name='book_detail'),
]