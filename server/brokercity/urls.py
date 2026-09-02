from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [

    # path('', views.home),

    ####################################
    # Authentication
    ####################################
    path('register/', views.register_view),
    path('me/', views.me_view),
    # JWT
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    #=====================================
    # Banks
    #=====================================
      # List with pagination
    path('banks/', views.BankListView.as_view(), name='bank-list'),
    
    # Create
    path('banks/create/', views.BankCreateView.as_view(), name='bank-create'),
    
    # Detail
    path('banks/<int:id>/', views.BankDetailView.as_view(), name='bank-detail'), 
    
    # Update
    path('banks/<int:id>/update/', views.BankUpdateView.as_view(), name='bank-update'),
    
    # Delete
    path('banks/<int:id>/delete/', views.BankDeleteView.as_view(), name='bank-delete'),
    
    # Toggle status
    path('banks/<int:id>/toggle-status/', views.BankToggleStatusView.as_view(), name='bank-toggle-status'),
    
    # Deposit/Withdraw
    path('banks/<int:id>/transaction/', views.BankTransactionView.as_view(), name='bank-transaction'),

    
    #========================================
    # Cash Box
    #========================================
    # List all (no pagination)
    path('cashboxes/', views.CashBoxListView.as_view(), name='cashbox-list'),
    
    # Create
    path('cashboxes/create/', views.CashBoxCreateView.as_view(), name='cashbox-create'),
    
    # Detail
    path('cashboxes/<int:id>/', views.CashBoxDetailView.as_view(), name='cashbox-detail'),
    
    # Update
    path('cashboxes/<int:id>/update/', views.CashBoxUpdateView.as_view(), name='cashbox-update'),
    
    # Delete
    path('cashboxes/<int:id>/delete/', views.CashBoxDeleteView.as_view(), name='cashbox-delete'),
    
    # Deposit/Withdraw
    path('cashboxes/<int:id>/transaction/', views.CashBoxTransactionView.as_view(), name='cashbox-transaction'),
    
    # Summary
    path('cashboxes/summary/', views.CashBoxSummaryView.as_view(), name='cashbox-summary'),

    
    
    #================================================
    # Account and AccountCategories urls
    #=================================================
    
     # Account Category URLs
     # Account Category URLs - FIXED typo (was 'acccategories')
    path('categories/', views.AccountCategoryListView.as_view(), name='category-list'),
    path('categories/create/', views.AccountCategoryCreateView.as_view(), name='category-create'),
    path('categories/update/<int:id>/', views.AccountCategoryUpdateView.as_view(), name='category-update'),
    path('categories/delete/<int:id>/', views.AccountCategoryDeleteView.as_view(), name='category-delete'),
    
    # Account URLs
    path('accounts/', views.AccountListView.as_view(), name='account-list'),
    path('accounts/create/', views.AccountCreateView.as_view(), name='account-create'),
    path('accounts/update/<int:id>/', views.AccountUpdateView.as_view(), name='account-update'),
    path('accounts/delete/<int:id>/', views.AccountDeleteView.as_view(), name='account-delete'),
    
    #================================================
    # Transactions
    #=================================================
    path('transactions/', views.TransactionListView.as_view(), name='transaction-list'),
    path('transactions/create/', views.TransactionCreateView.as_view(), name='transaction-create'),
    path('transactions/<int:id>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
    path('transactions/<int:id>/update/', views.TransactionUpdateView.as_view(), name='transaction-update'),
    path('transactions/<int:id>/delete/', views.TransactionDeleteView.as_view(), name='transaction-delete'),

    #===============================================
    # Dashbord
    #=============================================
    path('api/dashboard/summary/', views.DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('api/dashboard/chart/', views.DashboardChartView.as_view(), name='dashboard-chart'),
    path('api/dashboard/recent/', views.DashboardRecentTransactionsView.as_view(), name='dashboard-recent'),
]




    ####################################################################################################
    ####################################################################################################

    # POST /api/properties/create/
    #         ↓
    # Create Property
    #         ↓
    # Property ID = 5
    #         ↓
    # POST /api/property-images/create/
    #         ↓
    # property = 5
    # image = photo1.jpg
    #         ↓
    # POST /api/property-images/create/
    #         ↓
    # property = 5
    # image = photo2.jpg