from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [

    # path('', views.home),
    # Backup databse
    path(
        "admin/database-backup/",
        views.database_backup_view,
        name="database-backup"
    ),
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
    path('dashboard/summary/', views.DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/chart/', views.DashboardChartView.as_view(), name='dashboard-chart'),
    path('dashboard/recent/', views.DashboardRecentTransactionsView.as_view(), name='dashboard-recent'),

    #===============================================
    # Customer and Twilio
    #==============================================
    # path('customers/', views.CustomerViewSet.as_view(), name='customer-list-create'),
    #path('customers/send-whatsapp/', SendWhatsAppView.as_view(), name='send-whatsapp')

    #==============================================
    # Twilio Whatsup 
    #===============================================
    path('whatsapp/send/', views.SendWhatsAppView.as_view(), name='whatsapp-send'),
    path('whatsapp/messages/', views.WhatsAppMessageListView.as_view(), name='whatsapp-messages'),
    path('whatsapp/webhook/', views.WhatsAppWebhookView.as_view(), name='whatsapp-webhook'),

    ################################################
    # Properties Management
    ################################################
    # Owner
    # ==============================================
    # OWNER APIs
    # ==============================================

    # Create new owner
    path('owners/create/', views.create_owner, name='create-owner'),

    # Fetch all owners
    path('owners/', views.get_all_owners, name='get-all-owners' ),

    # Fetch owner details
    path('owners/<int:pk>/', views.get_owner_details, name='get-owner-details'),

    # Update owner
    path('owners/<int:pk>/update/', views.update_owner, name='update-owner' ),

    # Delete owner
    path('owners/<int:pk>/delete/', views.delete_owner, name='delete-owner' ),

    # ========================================================
    # CATEGORY APIs
    # ========================================================

    # Create category
    path('buildings/create/', views.create_building, name='create-building'
    ),

    # Fetch all categories
    path('buildings/', views.get_all_buildings, name='get-all-buildings'),

    # Fetch category details
    path('buildings/<int:pk>/', views.get_building_details, name='get-building-details' ),

    # Update category
    path('buildings/<int:pk>/update/', views.update_building, name='update-building' ),

    # Delete category
    path('buildings/<int:pk>/delete/',views.delete_building, name='delete-building' ),

    # ========================================================
    # UNIT APIs
    # ========================================================

    # Create unit
    path('units/create/', views.create_unit, name='create-unit' ),

    # Fetch all units
    path('units/', views.get_all_units, name='get-all-units' ),

    # Fetch unit details
    path('units/<int:pk>/', views.get_unit_details, name='get-unit-details' ),

    # Update unit
    path('units/<int:pk>/update/', views.update_unit, name='update-unit'),

    # Delete unit
    path('units/<int:pk>/delete/', views.delete_unit, name='delete-unit'),

    # ========================================================
    # RENTAL APIs
    # ========================================================
    path('rentals/', views.get_all_rentals, name='get_all_rentals', ),
    path('rentals/create/', views.create_rental, name='create_rental', ),
    path('rentals/<int:pk>/', views.get_rental_details, name='get_rental_details',),
    path('rentals/<int:pk>/update/', views.update_rental, name='update_rental', ),
    path('rentals/<int:pk>/delete/', views.delete_rental, name='delete_rental', ),


    ###########################################################    # website
    ###########################################################
    path('sliders/', views.SliderListCreateView.as_view(), name='slider-list-create'),
    path('sliders/<int:pk>/', views.SliderDetailView.as_view(), name='slider-detail'),


    #===========================================================
    # Developer
    #===========================================================
    path('developers/', views.DeveloperListCreateView.as_view(), name='developer-list-create'),
    path('developers/<int:pk>/', views.DeveloperDetailView.as_view(), name='developer-detail'),

    # Bulk email send
    path('send-email/', views.SendBulkEmailView.as_view(), name='send-bulk-email'),

    # Optional test endpoint
    path('test-email/', views.test_email_view, name='test-email'),
    # http://127.0.0.1:8000/api/test-email/
    
    #Purpose: This is a one-off health-check to verify your SMTP/email configuration works. It is NOT meant to be used by the UI.
    #Method: GET only
    #===========================================================
    # Offer sale
    #============================================================
    path("offersales/", views.OffersaleListCreateView.as_view(), name="offersale-list-create", ),
    # UPDATE + DELETE
    path("offersales/<int:pk>/", views.OffersaleUpdateDeleteView.as_view(), name="offersale-update-delete", ),
    # FETCH DETAIL
    path("offersales/<int:pk>/", views.OffersaleDetailView.as_view(), name="offersale-detail",),



    #===========================================================
    # Payment Plan
    #===========================================================
      # LIST + CREATE
    path("payment-plans/", views.PaymentPlanListCreateView.as_view(), name="payment-plan-list-create", ),

    # UPDATE + DELETE
    path("payment-plans/<int:pk>/", views.PaymentPlanUpdateDeleteView.as_view(), name="payment-plan-update-delete",),

    ##########################################################
    # Monitoring
    ##########################################################
      # Create
    path('monitor/create/', views.monitor_create, name='monitoring-create'),

    # Delete
    path('monitor/delete/<int:pk>/', views.monitor_delete, name='monitoring-delete'),

    # Fetch all (with search, day, month, date range) + pagination
    path('monitor/', views.monitor_list, name='monitoring-list'),

    # Fetch one
    path('monitor/<int:pk>/', views.monitor_detail, name='monitoring-detail'),
   
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