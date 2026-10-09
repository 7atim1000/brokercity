from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .models import Profile, CashBox, Bank, Transaction, Account, AccountCategory, Customer, WhatsAppMessage, Owner, Building, Unit, Slider, Rental, Developer, Offersale, Monitor
from rest_framework.response import Response
from rest_framework import status, generics, filters
from django.shortcuts import render, get_object_or_404
# image upload: 
from rest_framework.parsers import MultiPartParser, FormParser
###############
# pip install django-filter
from django_filters.rest_framework import DjangoFilterBackend
# Dashboard
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from decimal import Decimal
#################
# Twilio
################
from rest_framework import viewsets
from rest_framework.decorators import action
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client
from django.conf import settings
import logging
import traceback
from rest_framework_simplejwt.views import TokenObtainPairView
###############
# Backup
##############
import os
import subprocess
from django.http import JsonResponse

##############
# Website
#############
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser  #

##############
# Email
##############
from datetime import datetime
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.core.mail import send_mail  


from .serializers import (
    UserSerializer,
    RegisterSerializer,

    BankSerializer,
    BankListSerializer,
    BankCreateUpdateSerializer,
    BankPagination,

    CashBoxSerializer,
    CashBoxCreateUpdateSerializer,
    CashBoxListSerializer,
    
    AccountCategorySerializer, 
    AccountSerializer, 
    AccountListSerializer,

    TransactionListSerializer,
    TransactionDetailSerializer,
    TransactionCreateUpdateSerializer,

    DashboardSummarySerializer, 
    DashboardChartSerializer,
    DashboardTransactionSerializer,

    CustomerSerializer,
    # Twilio
    WhatsAppMessageSerializer,
    SendWhatsAppSerializer,


    # Properties Management 
    OwnerSerializer,
    BuildingSerializer,
    UnitSerializer,
    RentalSerializer,
    SliderSerializer,
    
    # Developer
    DeveloperSerializer, DeveloperDetailSerializer, SendEmailSerializer, 

    # OfferSale
    OffersaleSerializer, OffersaleListSerializer, PaymentPlanSerializer,

    # Monitoring
    MonitorSerializer,
    MonitorCreateSerializer,
    )

# Dashboard
logger = logging.getLogger(__name__)


# Pagination
# from .pagination import ProjectPagination
from rest_framework.pagination import PageNumberPagination


# Create your views here.
# manual database backup


#########################
# def test_email_view(request):
#     try:
#         send_mail(
#             subject="Test from Broker's City",
#             message="Broker City Properties welcomes you. If you received this in your inbox (not spam), everything is working!",
#             from_email="info@brokerscity.ae",
#             recipient_list=["mohammad-alahmad@brokerscity.ae"],
#             fail_silently=False,
#         )
#         return JsonResponse({"status": "success", "message": "Email sent!"})
#     except Exception as e:
#         return JsonResponse({"status": "error", "message": str(e)}, status=500)




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def database_backup_view(request):

    # Only admin users
    if not request.user.is_staff:
        return JsonResponse(
            {
                "success": False,
                "message": "Permission denied."
            },
            status=403
        )

    try:
        database_url = os.getenv("DATABASE_URL")

        if not database_url:
            return JsonResponse(
                {
                    "success": False,
                    "message": "DATABASE_URL is not configured."
                },
                status=500
            )

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        backup_dir = os.path.join(
            settings.BASE_DIR,
            "backups"
        )

        os.makedirs(
            backup_dir,
            exist_ok=True
        )

        backup_file = os.path.join(
            backup_dir,
            f"database_backup_{timestamp}.sql"
        )

        subprocess.run(
            [
                "pg_dump",
                database_url,
                "-f",
                backup_file,
            ],
            check=True
        )

        return JsonResponse(
            {
                "success": True,
                "message": "Database backup created successfully.",
                "filename": os.path.basename(backup_file),
            }
        )

    except subprocess.CalledProcessError as error:

        return JsonResponse(
            {
                "success": False,
                "message": f"Database backup failed: {error}"
            },
            status=500
        )

    except Exception as error:

        return JsonResponse(
            {
                "success": False,
                "message": str(error)
            },
            status=500
        )

# =========================================================
# REGISTER
# =========================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):

    serializer = RegisterSerializer(
        data=request.data
    )

    if serializer.is_valid():

        user = serializer.save()

        return Response(
            {
                "message": "User Created Successfully",
                "user": UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )

    print("REGISTER ERRORS:", serializer.errors)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

##################################
# Get currently logged-in user
##################################
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user)

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )



#==========================================================
# CashBox View
#=========================================================
# =========================================================
# List CashBoxes (No pagination)
# =========================================================

class CashBoxListView(generics.ListAPIView):
    """List all cash boxes (no pagination)"""
    queryset = CashBox.objects.all().order_by('name')
    serializer_class = CashBoxListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset"""
        queryset = super().get_queryset()
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset


# =========================================================
# Get CashBox Details
# =========================================================

class CashBoxDetailView(generics.RetrieveAPIView):
    """Get cash box details by ID"""
    queryset = CashBox.objects.all()
    serializer_class = CashBoxSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


# =========================================================
# Create CashBox
# =========================================================

class CashBoxCreateView(generics.CreateAPIView):
    """Create a new cash box"""
    queryset = CashBox.objects.all()
    serializer_class = CashBoxCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create with additional logic"""
        serializer.save()


# =========================================================
# Update CashBox
# =========================================================

class CashBoxUpdateView(generics.UpdateAPIView):
    """Update an existing cash box"""
    queryset = CashBox.objects.all()
    serializer_class = CashBoxCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


# =========================================================
# Delete CashBox
# =========================================================

class CashBoxDeleteView(generics.DestroyAPIView):
    """Delete a cash box"""
    queryset = CashBox.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"message": "Cash box deleted successfully"},
            status=status.HTTP_200_OK
        )


# =========================================================
# Deposit/Withdraw CashBox
# =========================================================

class CashBoxTransactionView(generics.GenericAPIView):
    """Handle deposit and withdraw operations"""
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def post(self, request, id):
        cashbox = get_object_or_404(CashBox, id=id)
        
        transaction_type = request.data.get('type')
        amount = request.data.get('amount')
        
        if not transaction_type or not amount:
            return Response(
                {"error": "Type and amount are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
        except ValueError:
            return Response(
                {"error": "Invalid amount"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if transaction_type == 'deposit':
                new_balance = cashbox.deposit(amount)
                message = f"Deposited {amount} successfully"
            elif transaction_type == 'withdraw':
                new_balance = cashbox.withdraw(amount)
                message = f"Withdrew {amount} successfully"
            else:
                return Response(
                    {"error": "Invalid transaction type. Use 'deposit' or 'withdraw'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                "message": message,
                "new_balance": new_balance
            })
            
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# =========================================================
# CashBox Summary (Total balance of all cash boxes)
# =========================================================

class CashBoxSummaryView(generics.GenericAPIView):
    """Get summary of all cash boxes"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        cashboxes = CashBox.objects.all()
        
        total_balance = sum(cashbox.balance for cashbox in cashboxes)
        total_opening = sum(cashbox.balance_opening for cashbox in cashboxes)
        total_growth = total_balance - total_opening
        
        return Response({
            "total_cashboxes": cashboxes.count(),
            "total_balance": total_balance,
            "total_opening_balance": total_opening,
            "total_growth": total_growth,
        })


#==========================================================
# Bank View
#==========================================================
# =========================================================
# List Banks (with pagination)
# =========================================================

class BankListView(generics.ListAPIView):
    """List all banks with pagination"""
    queryset = Bank.objects.all().order_by('name')
    serializer_class = BankListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = BankPagination
    
    def get_queryset(self):
        """Filter queryset"""
        queryset = super().get_queryset()
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # Filter by currency
        currency = self.request.query_params.get('currency')
        if currency:
            queryset = queryset.filter(currency=currency)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset


# =========================================================
# Create Bank
# =========================================================

class BankCreateView(generics.CreateAPIView):
    """Create a new bank"""
    queryset = Bank.objects.all()
    serializer_class = BankCreateUpdateSerializer
    permission_classes = [IsAuthenticated]


# =========================================================
# Get Bank Details
# =========================================================

class BankDetailView(generics.RetrieveAPIView):
    """Get bank details by ID"""
    queryset = Bank.objects.all()
    serializer_class = BankSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


# =========================================================
# Update Bank
# =========================================================

class BankUpdateView(generics.UpdateAPIView):
    """Update an existing bank"""
    queryset = Bank.objects.all()
    serializer_class = BankCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'


# =========================================================
# Delete Bank
# =========================================================

class BankDeleteView(generics.DestroyAPIView):
    """Delete a bank"""
    queryset = Bank.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"message": "Bank deleted successfully"},
            status=status.HTTP_200_OK
        )


# =========================================================
# Toggle Bank Status
# =========================================================

class BankToggleStatusView(generics.GenericAPIView):
    """Toggle bank active status"""
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def patch(self, request, id):
        bank = get_object_or_404(Bank, id=id)
        bank.is_active = not bank.is_active
        bank.save()
        
        return Response({
            "id": bank.id,
            "name": bank.name,
            "is_active": bank.is_active,
            "message": f"Bank {'activated' if bank.is_active else 'deactivated'}"
        })


# =========================================================
# Deposit/Withdraw
# =========================================================

class BankTransactionView(generics.GenericAPIView):
    """Handle deposit and withdraw operations"""
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def post(self, request, id):
        bank = get_object_or_404(Bank, id=id)
        
        transaction_type = request.data.get('type')
        amount = request.data.get('amount')
        
        if not transaction_type or not amount:
            return Response(
                {"error": "Type and amount are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
        except ValueError:
            return Response(
                {"error": "Invalid amount"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if transaction_type == 'deposit':
                new_balance = bank.deposit(amount)
                message = f"Deposited {amount} successfully"
            elif transaction_type == 'withdraw':
                new_balance = bank.withdraw(amount)
                message = f"Withdrew {amount} successfully"
            else:
                return Response(
                    {"error": "Invalid transaction type"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                "message": message,
                "new_balance": new_balance,
                "formatted_balance": bank.get_formatted_balance()
            })
            
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )



#=====================================================
#AccountCategories and Accounts views
#=====================================================
class AccountCategoryListView(APIView):
    """List all account categories"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            categories = AccountCategory.objects.all().order_by('name')
            serializer = AccountCategorySerializer(categories, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in AccountCategoryListView: {e}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AccountCategoryCreateView(generics.CreateAPIView):
    """Create a new account category"""
    queryset = AccountCategory.objects.all()
    serializer_class = AccountCategorySerializer
    permission_classes = [IsAuthenticated]

class AccountCategoryUpdateView(generics.UpdateAPIView):
    """Update an existing account category"""
    queryset = AccountCategory.objects.all()
    serializer_class = AccountCategorySerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

class AccountCategoryDeleteView(generics.DestroyAPIView):
    """Delete an account category"""
    queryset = AccountCategory.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()
            return Response(
                {"message": "Account category deleted successfully"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            if 'ProtectedError' in str(type(e)):
                return Response(
                    {"error": "Cannot delete category because it has associated accounts"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            raise e


# class AccountListView(generics.ListAPIView):
#     """List all accounts (no pagination)"""
#     queryset = Account.objects.all().select_related('category').order_by('name')
#     serializer_class = AccountListSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         """Filter queryset"""
#         queryset = super().get_queryset()
        
#         # Search by name
#         search = self.request.query_params.get('search')
#         if search:
#             queryset = queryset.filter(name__icontains=search)
        
#         # Filter by type
#         account_type = self.request.query_params.get('type')
#         if account_type:
#             queryset = queryset.filter(type=account_type)
        
#         # Filter by category
#         category_id = self.request.query_params.get('category_id')
#         if category_id:
#             queryset = queryset.filter(category_id=category_id)
        
#         return queryset


class AccountListView(generics.ListAPIView):
    """List all accounts (no pagination)"""
    queryset = Account.objects.all().select_related('category').order_by('name')
    serializer_class = AccountListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset with debugging"""
        print("=== AccountListView called ===")
        print(f"User: {self.request.user}")
        print(f"Query params: {self.request.query_params}")
        
        queryset = super().get_queryset()
        print(f"Initial queryset count: {queryset.count()}")
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            print(f"Filtering by search: {search}")
            queryset = queryset.filter(name__icontains=search)
            print(f"After search filter count: {queryset.count()}")
        
        # Filter by type
        account_type = self.request.query_params.get('type')
        if account_type:
            print(f"Filtering by type: {account_type}")
            queryset = queryset.filter(type=account_type)
            print(f"After type filter count: {queryset.count()}")
        
        # Filter by category
        category_id = self.request.query_params.get('category_id')
        if category_id:
            print(f"Filtering by category_id: {category_id}")
            try:
                # Check if category exists
                category = AccountCategory.objects.get(id=category_id)
                print(f"Category found: {category.name}")
                queryset = queryset.filter(category_id=category_id)
                print(f"After category filter count: {queryset.count()}")
            except AccountCategory.DoesNotExist:
                print(f"⚠️ Category with ID {category_id} does not exist!")
                # Return empty queryset if category doesn't exist
                return Account.objects.none()
        
        print(f"Final queryset count: {queryset.count()}")
        print(f"Final SQL: {str(queryset.query)}")
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list method for additional debugging"""
        print("=== AccountListView.list() called ===")
        print(f"Request path: {request.path}")
        print(f"Request method: {request.method}")
        
        try:
            # Get the filtered queryset
            queryset = self.get_queryset()
            
            # Check if there are any accounts in the database
            total_accounts = Account.objects.all().count()
            print(f"Total accounts in database: {total_accounts}")
            
            # Serialize the data
            serializer = self.get_serializer(queryset, many=True)
            
            print(f"Serialized data length: {len(serializer.data)}")
            if len(serializer.data) > 0:
                print(f"First item sample: {serializer.data[0]}")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ ERROR in AccountListView: {e}")
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": str(e), "traceback": traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

            
class AccountCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print("=== AccountCreateView called ===")
        print(f"User: {request.user}")
        print(f"Request data: {request.data}")
        
        serializer = AccountSerializer(data=request.data)
        
        if serializer.is_valid():
            print("Data is valid, saving...")
            serializer.save()
            print("Account created successfully!")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print("Validation errors:", serializer.errors)
        print("Invalid data:", request.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AccountUpdateView(generics.UpdateAPIView):
    """Update an existing account"""
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

class AccountDeleteView(generics.DestroyAPIView):
    """Delete an account"""
    queryset = Account.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"message": "Account deleted successfully"},
            status=status.HTTP_200_OK
        )

######################################################
################# Transactions #######################
######################################################
# Pagination Class
# class TransactionPagination(PageNumberPagination):
#     page_size = 20
#     page_size_query_param = 'page_size'
#     max_page_size = 100


# # 1. List Transactions (with pagination, filtering, search)
# class TransactionListView(generics.ListAPIView):
#     """
#     GET /api/transactions/
#     List all transactions with pagination, filtering, and search.
    
#     Query Parameters:
#     - page: Page number
#     - page_size: Items per page (default: 20, max: 100)
#     - search: Search by transaction_no, statement, check_no, person_receipt
#     - type: Filter by type (deposit/withdraw)
#     - payment_method: Filter by payment_method (banks/cash)
#     - currency: Filter by currency (AED/USD/EUR/SAR)
#     - has_check: Filter by has_check (true/false)
#     - transaction_date_after: Filter by date (YYYY-MM-DD)
#     - transaction_date_before: Filter by date (YYYY-MM-DD)
#     - ordering: Order by field (transaction_date, created_at, amount)
#     """
#     serializer_class = TransactionListSerializer
#     permission_classes = [IsAuthenticated]
#     pagination_class = TransactionPagination
    
#     filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
#     filterset_fields = ['type', 'payment_method', 'currency', 'has_check']
#     search_fields = ['transaction_no', 'statement', 'check_no', 'person_receipt']
#     ordering_fields = ['transaction_date', 'created_at', 'amount']
#     ordering = ['-transaction_date']
    
#     def get_queryset(self):
#         queryset = Transaction.objects.all()
        
#         # Date filtering
#         date_after = self.request.query_params.get('transaction_date_after')
#         date_before = self.request.query_params.get('transaction_date_before')
        
#         if date_after:
#             queryset = queryset.filter(transaction_date__gte=date_after)
#         if date_before:
#             queryset = queryset.filter(transaction_date__lte=date_before)
        
#         return queryset


# # 2. Transaction Detail
# class TransactionDetailView(generics.RetrieveAPIView):
#     """
#     GET /api/transactions/{id}/
#     Get detailed information about a specific transaction.
#     """
#     serializer_class = TransactionDetailSerializer
#     permission_classes = [IsAuthenticated]
#     lookup_field = 'id'
    
#     def get_queryset(self):
#         return Transaction.objects.all()


# ```python
# class TransactionCreateView(generics.CreateAPIView):
#     """
#     POST /api/transactions/
#     Create a new transaction.

#     Required fields based on type and payment_method:
#     - Deposit + Banks: transaction_no, account_from, bank
#     - Deposit + Cash: transaction_no, account_from, cashbox
#     - Withdraw + Banks: transaction_no, account_to, bank
#     - Withdraw + Cash: transaction_no, account_to, cashbox

#     Example - Deposit via Bank:
#     {
#         "transaction_no": "TRX-000001",
#         "type": "deposit",
#         "payment_method": "banks",
#         "account_from": 1,
#         "bank": 1,
#         "amount": "1500.00",
#         "transaction_date": "2024-01-15",
#         "statement": "Salary deposit",
#         "currency": "AED",
#         "amount_to_arabic": "ألف وخمسمائة درهم إماراتي فقط لا غير",
#         "amount_to_english": "One thousand five hundred UAE Dirhams only"
#     }
#     """
#     # serializer_class = TransactionCreateUpdateSerializer
#     # permission_classes = [IsAuthenticated]

#     # def perform_create(self, serializer):
#     #     serializer.save(transaction_user=self.request.user)

#     queryset = Transaction.objects.all()
#     serializer_class = TransactionCreateUpdateSerializer
#     permission_classes = [IsAuthenticated]

#     queryset = Transaction.objects.all()
#     serializer_class = TransactionCreateUpdateSerializer
#     permission_classes = [IsAuthenticated]

#     def create(self, request, *args, **kwargs):
#         print("=" * 80)
#         print("=== TRANSACTION CREATE VIEW CALLED ===")
#         print(f"User: {request.user}")
#         print(f"Request method: {request.method}")
#         print(f"Request content type: {request.content_type}")
#         print(f"Request data: {request.data}")
#         print(f"Request FILES: {request.FILES}")
#         print("=" * 80)

#         # Check if it's FormData or JSON
#         if request.content_type and 'multipart/form-data' in request.content_type:
#             print("=== FORM DATA RECEIVED ===")
#             for key, value in request.data.items():
#                 print(f"  {key}: {value} (type: {type(value)})")
#             print("=" * 80)

#         serializer = self.get_serializer(data=request.data)

#         if not serializer.is_valid():
#             print("=== SERIALIZER ERRORS ===")
#             print(f"Errors: {serializer.errors}")
#             print(f"Validated data before errors: {serializer.validated_data}")
#             print("=" * 80)
#             return Response(
#                 serializer.errors,
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         print("=== SERIALIZER VALIDATED DATA ===")
#         for key, value in serializer.validated_data.items():
#             print(f"  {key}: {value} (type: {type(value)})")
#         print("=" * 80)

#         return super().create(request, *args, **kwargs)

#     def perform_create(self, serializer):
#         print("=" * 80)
#         print("=== PERFORM_CREATE CALLED ===")
#         print(f"User: {self.request.user}")
#         print(f"Serializer validated data before save: {serializer.validated_data}")
#         print("=" * 80)

#         # Save with the current user
#         transaction = serializer.save(transaction_user=self.request.user)

#         print("=" * 80)
#         print("=== TRANSACTION SAVED ===")
#         print(f"Transaction ID: {transaction.id}")
#         print(f"Transaction No: {transaction.transaction_no}")
#         # payment_method
#         print(f"Payment Method: {transaction.payment_method}")
#         print(f"Account From: {transaction.account_from}")
#         print(f"Account To: {transaction.account_to}")
#         print(f"Bank: {transaction.bank}")
#         print(f"Cashbox: {transaction.cashbox}")
#         print(f"Person Deliver: {transaction.person_deliver}")
#         print(f"Person Receipt: {transaction.person_receipt}")
#         print(f"Check No: {transaction.check_no}")
#         print(f"Check Bank: {transaction.check_bank}")
#         print(f"Check Date: {transaction.check_date}")
#         print(f"Document No: {transaction.document_no}")
#         print(f"Transaction User: {transaction.transaction_user}")

#         print("=" * 80)


# # 4. Update Transaction
# class TransactionUpdateView(generics.UpdateAPIView):
#     """
#     PUT /api/transactions/{id}/update/
#     PATCH /api/transactions/{id}/update/
#     Update an existing transaction.
#     """
#     serializer_class = TransactionCreateUpdateSerializer
#     permission_classes = [IsAuthenticated]
#     lookup_field = 'id'

#     def get_queryset(self):
#         return Transaction.objects.all()


# # 5. Delete Transaction
# class TransactionDeleteView(generics.DestroyAPIView):
#     """
#     DELETE /api/transactions/{id}/delete/
#     Delete a transaction.
#     """
#     permission_classes = [IsAuthenticated]
#     lookup_field = 'id'
    
#     def get_queryset(self):
#         return Transaction.objects.all()
    
#     def destroy(self, request, *args, **kwargs):
#         instance = self.get_object()
#         transaction_no = instance.transaction_no
#         self.perform_destroy(instance)
#         return Response({
#             'message': f'Transaction {transaction_no} deleted successfully'
#         }, status=status.HTTP_200_OK)


# # 6. Combined View (All-in-One - Recommended)
# class TransactionViewSet(generics.GenericAPIView):
#     """
#     Combined view for all transaction operations.
    
#     GET    /api/transactions/          - List with pagination
#     POST   /api/transactions/          - Create
#     GET    /api/transactions/{id}/     - Detail
#     PUT    /api/transactions/{id}/     - Update
#     PATCH  /api/transactions/{id}/     - Partial update
#     DELETE /api/transactions/{id}/     - Delete
#     """
#     permission_classes = [IsAuthenticated]
#     pagination_class = TransactionPagination
    
#     def get_serializer_class(self):
#         if self.request.method == 'GET':
#             if self.kwargs.get('id'):
#                 return TransactionDetailSerializer
#             return TransactionListSerializer
#         return TransactionCreateUpdateSerializer
    
#     def get_queryset(self):
#         return Transaction.objects.all()
    
#     def get(self, request, *args, **kwargs):
#         """GET /api/transactions/ - List all transactions"""
#         if kwargs.get('id'):
#             # Detail view
#             instance = self.get_queryset().filter(id=kwargs['id']).first()
#             if not instance:
#                 return Response(
#                     {'error': 'Transaction not found'}, 
#                     status=status.HTTP_404_NOT_FOUND
#                 )
#             serializer = TransactionDetailSerializer(instance)
#             return Response(serializer.data)
        
#         # List view with pagination
#         queryset = self.get_queryset()
        
#         # Apply filters from query params
#         date_after = request.query_params.get('transaction_date_after')
#         date_before = request.query_params.get('transaction_date_before')
#         transaction_type = request.query_params.get('type')
#         payment_method = request.query_params.get('payment_method')
        
#         if date_after:
#             queryset = queryset.filter(transaction_date__gte=date_after)
#         if date_before:
#             queryset = queryset.filter(transaction_date__lte=date_before)
#         if transaction_type:
#             queryset = queryset.filter(type=transaction_type)
#         if payment_method:
#             queryset = queryset.filter(payment_method=payment_method)
        
#         page = self.paginate_queryset(queryset)
#         if page is not None:
#             serializer = TransactionListSerializer(page, many=True)
#             return self.get_paginated_response(serializer.data)
        
#         serializer = TransactionListSerializer(queryset, many=True)
#         return Response(serializer.data)
    
#     def post(self, request, *args, **kwargs):
#         """POST /api/transactions/ - Create a new transaction"""
#         serializer = TransactionCreateUpdateSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save(transaction_user=request.user)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#     def put(self, request, *args, **kwargs):
#         """PUT /api/transactions/{id}/ - Update a transaction"""
#         instance = self.get_queryset().filter(id=kwargs.get('id')).first()
#         if not instance:
#             return Response(
#                 {'error': 'Transaction not found'}, 
#                 status=status.HTTP_404_NOT_FOUND
#             )
        
#         serializer = TransactionCreateUpdateSerializer(instance, data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#     def patch(self, request, *args, **kwargs):
#         """PATCH /api/transactions/{id}/ - Partial update"""
#         return self.put(request, *args, **kwargs)
    
#     def delete(self, request, *args, **kwargs):
#         """DELETE /api/transactions/{id}/ - Delete a transaction"""
#         instance = self.get_queryset().filter(id=kwargs.get('id')).first()
#         if not instance:
#             return Response(
#                 {'error': 'Transaction not found'}, 
#                 status=status.HTTP_404_NOT_FOUND
#             )
        
#         transaction_no = instance.transaction_no
#         instance.delete()
#         return Response({
#             'message': f'Transaction {transaction_no} deleted successfully'
#         }, status=status.HTTP_200_OK)



class TransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# 1. List Transactions (with pagination, filtering, search)
class TransactionListView(generics.ListAPIView):
    """
    GET /api/transactions/
    List all transactions with pagination, filtering, and search.

    Query Parameters:
    - page: Page number
    - page_size: Items per page (default: 20, max: 100)
    - search: Search by transaction_no, statement, check_no, person_receipt
    - type: Filter by type (deposit/withdraw)
    - payment_method: Filter by payment_method (banks/cash)
    - currency: Filter by currency (AED/USD/EUR/SAR)
    - has_check: Filter by has_check (true/false)
    - transaction_date_after: Filter by date (YYYY-MM-DD)
    - transaction_date_before: Filter by date (YYYY-MM-DD)
    - ordering: Order by field (transaction_date, created_at, amount)
    """
    serializer_class = TransactionListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TransactionPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'payment_method', 'currency', 'has_check']
    search_fields = ['transaction_no', 'statement', 'check_no', 'person_receipt']
    ordering_fields = ['transaction_date', 'created_at', 'amount']
    ordering = ['-transaction_date']

    def get_queryset(self):
        queryset = Transaction.objects.all()

        # Date filtering
        date_after = self.request.query_params.get('transaction_date_after')
        date_before = self.request.query_params.get('transaction_date_before')

        if date_after:
            queryset = queryset.filter(transaction_date__gte=date_after)
        if date_before:
            queryset = queryset.filter(transaction_date__lte=date_before)

        return queryset


# 2. Transaction Detail
class TransactionDetailView(generics.RetrieveAPIView):
    """
    GET /api/transactions/{id}/
    Get detailed information about a specific transaction.
    """
    serializer_class = TransactionDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Transaction.objects.all()


# 3. Create Transaction
class TransactionCreateView(generics.CreateAPIView):
    """
    POST /api/transactions/
    Create a new transaction.

    Required fields based on type and payment_method:
    - Deposit + Banks: transaction_no, account_from, bank
    - Deposit + Cash: transaction_no, account_from, cashbox
    - Withdraw + Banks: transaction_no, account_to, bank
    - Withdraw + Cash: transaction_no, account_to, cashbox

    Example - Deposit via Bank:
    {
        "transaction_no": "TRX-000001",
        "type": "deposit",
        "payment_method": "banks",
        "account_from": 1,
        "bank": 1,
        "subtotal": "1304.35",
        "vat": "195.65",
        "amount": "1500.00",
        "transaction_date": "2024-01-15",
        "statement": "Salary deposit",
        "currency": "AED",
        "amount_to_arabic": "ألف وخمسمائة درهم إماراتي فقط لا غير",
        "amount_to_english": "One thousand five hundred UAE Dirhams only"
    }
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionCreateUpdateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        print("=" * 80)
        print("=== TRANSACTION CREATE VIEW CALLED ===")
        print(f"User: {request.user}")
        print(f"Request method: {request.method}")
        print(f"Request content type: {request.content_type}")
        print(f"Request data: {request.data}")
        print(f"Request FILES: {request.FILES}")
        print("=" * 80)

        # Check if it's FormData or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            print("=== FORM DATA RECEIVED ===")
            for key, value in request.data.items():
                print(f"  {key}: {value} (type: {type(value)})")
            print("=" * 80)

        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            print("=== SERIALIZER ERRORS ===")
            print(f"Errors: {serializer.errors}")
            print(f"Validated data before errors: {serializer.validated_data}")
            print("=" * 80)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        print("=== SERIALIZER VALIDATED DATA ===")
        for key, value in serializer.validated_data.items():
            print(f"  {key}: {value} (type: {type(value)})")
        print("=" * 80)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        print("=" * 80)
        print("=== PERFORM_CREATE CALLED ===")
        print(f"User: {self.request.user}")
        print(f"Serializer validated data before save: {serializer.validated_data}")
        print("=" * 80)

        # Save with the current user
        transaction = serializer.save(transaction_user=self.request.user)

        print("=" * 80)
        print("=== TRANSACTION SAVED ===")
        print(f"Transaction ID: {transaction.id}")
        print(f"Transaction No: {transaction.transaction_no}")
        print(f"Payment Method: {transaction.payment_method}")
        print(f"Subtotal: {transaction.subtotal}")   # 👈 NEW (for debugging)
        print(f"VAT: {transaction.vat}")             # 👈 NEW (for debugging)
        print(f"Amount: {transaction.amount}")
        print(f"Account From: {transaction.account_from}")
        print(f"Account To: {transaction.account_to}")
        print(f"Bank: {transaction.bank}")
        print(f"Cashbox: {transaction.cashbox}")
        print(f"Person Deliver: {transaction.person_deliver}")
        print(f"Person Receipt: {transaction.person_receipt}")
        print(f"Check No: {transaction.check_no}")
        print(f"Check Bank: {transaction.check_bank}")
        print(f"Check Date: {transaction.check_date}")
        print(f"Document No: {transaction.document_no}")
        print(f"Transaction User: {transaction.transaction_user}")
        print("=" * 80)


# 4. Update Transaction
class TransactionUpdateView(generics.UpdateAPIView):
    """
    PUT /api/transactions/{id}/update/
    PATCH /api/transactions/{id}/update/
    Update an existing transaction.
    """
    serializer_class = TransactionCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Transaction.objects.all()


# 5. Delete Transaction
class TransactionDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/transactions/{id}/delete/
    Delete a transaction.
    """
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Transaction.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        transaction_no = instance.transaction_no
        self.perform_destroy(instance)
        return Response({
            'message': f'Transaction {transaction_no} deleted successfully'
        }, status=status.HTTP_200_OK)


# 6. Combined View (All-in-One - Recommended)
class TransactionViewSet(generics.GenericAPIView):
    """
    Combined view for all transaction operations.

    GET    /api/transactions/          - List with pagination
    POST   /api/transactions/          - Create
    GET    /api/transactions/{id}/     - Detail
    PUT    /api/transactions/{id}/     - Update
    PATCH  /api/transactions/{id}/     - Partial update
    DELETE /api/transactions/{id}/     - Delete
    """
    permission_classes = [IsAuthenticated]
    pagination_class = TransactionPagination

    def get_serializer_class(self):
        if self.request.method == 'GET':
            if self.kwargs.get('id'):
                return TransactionDetailSerializer
            return TransactionListSerializer
        return TransactionCreateUpdateSerializer

    def get_queryset(self):
        return Transaction.objects.all()

    def get(self, request, *args, **kwargs):
        """GET /api/transactions/ - List all transactions"""
        if kwargs.get('id'):
            # Detail view
            instance = self.get_queryset().filter(id=kwargs['id']).first()
            if not instance:
                return Response(
                    {'error': 'Transaction not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = TransactionDetailSerializer(instance)
            return Response(serializer.data)

        # List view with pagination
        queryset = self.get_queryset()

        # Apply filters from query params
        date_after = request.query_params.get('transaction_date_after')
        date_before = request.query_params.get('transaction_date_before')
        transaction_type = request.query_params.get('type')
        payment_method = request.query_params.get('payment_method')

        if date_after:
            queryset = queryset.filter(transaction_date__gte=date_after)
        if date_before:
            queryset = queryset.filter(transaction_date__lte=date_before)
        if transaction_type:
            queryset = queryset.filter(type=transaction_type)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = TransactionListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = TransactionListSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        """POST /api/transactions/ - Create a new transaction"""
        serializer = TransactionCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(transaction_user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, *args, **kwargs):
        """PUT /api/transactions/{id}/ - Update a transaction"""
        instance = self.get_queryset().filter(id=kwargs.get('id')).first()
        if not instance:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TransactionCreateUpdateSerializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, *args, **kwargs):
        """PATCH /api/transactions/{id}/ - Partial update"""
        return self.put(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        """DELETE /api/transactions/{id}/ - Delete a transaction"""
        instance = self.get_queryset().filter(id=kwargs.get('id')).first()
        if not instance:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        transaction_no = instance.transaction_no
        instance.delete()
        return Response({
            'message': f'Transaction {transaction_no} deleted successfully'
        }, status=status.HTTP_200_OK)



#=======================================
# Dashbord :-
#=====================================
class DashboardSummaryView(APIView):
    """View to get dashboard summary statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get date range (last 30 days by default)
            days = request.query_params.get('days', 30)
            try:
                days = int(days)
            except ValueError:
                days = 30
                
            end_date = timezone.now().date()  # Use date, not datetime
            start_date = end_date - timedelta(days=days)
            
            # Get all transactions in date range
            transactions = Transaction.objects.filter(
                transaction_date__gte=start_date,
                transaction_date__lte=end_date
            )
            
            # Calculate totals
            total_deposits = transactions.filter(type='deposit').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0')
            
            total_withdraws = transactions.filter(type='withdraw').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0')
            
            total_balance = total_deposits - total_withdraws
            
            deposit_count = transactions.filter(type='deposit').count()
            withdraw_count = transactions.filter(type='withdraw').count()
            total_transactions = transactions.count()
            
            data = {
                'total_deposits': float(total_deposits),
                'total_withdraws': float(total_withdraws),
                'total_balance': float(total_balance),
                'total_transactions': total_transactions,
                'deposit_count': deposit_count,
                'withdraw_count': withdraw_count,
            }
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in DashboardSummaryView: {str(e)}")
            return Response(
                {'error': 'Failed to fetch dashboard summary'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DashboardChartView(APIView):
    """View to get chart data for dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get period and days
            period = request.query_params.get('period', 'daily')
            days = request.query_params.get('days', 30)
            
            try:
                days = int(days)
            except ValueError:
                days = 30
                
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days)
            
            # Get all transactions in date range
            transactions = Transaction.objects.filter(
                transaction_date__gte=start_date,
                transaction_date__lte=end_date
            )
            
            # Group by period
            if period == 'daily':
                # Group by date
                deposits = transactions.filter(type='deposit').annotate(
                    period_date=TruncDate('transaction_date')
                ).values('period_date').annotate(
                    total=Sum('amount')
                ).order_by('period_date')
                
                withdraws = transactions.filter(type='withdraw').annotate(
                    period_date=TruncDate('transaction_date')
                ).values('period_date').annotate(
                    total=Sum('amount')
                ).order_by('period_date')
                
            elif period == 'weekly':
                # Group by week
                deposits = transactions.filter(type='deposit').annotate(
                    period_date=TruncWeek('transaction_date')
                ).values('period_date').annotate(
                    total=Sum('amount')
                ).order_by('period_date')
                
                withdraws = transactions.filter(type='withdraw').annotate(
                    period_date=TruncWeek('transaction_date')
                ).values('period_date').annotate(
                    total=Sum('amount')
                ).order_by('period_date')
                
            else:  # monthly
                # Group by month
                deposits = transactions.filter(type='deposit').annotate(
                    period_date=TruncMonth('transaction_date')
                ).values('period_date').annotate(
                    total=Sum('amount')
                ).order_by('period_date')
                
                withdraws = transactions.filter(type='withdraw').annotate(
                    period_date=TruncMonth('transaction_date')
                ).values('period_date').annotate(
                    total=Sum('amount')
                ).order_by('period_date')
            
            # Create dictionaries for easy lookup
            deposits_dict = {item['period_date']: float(item['total']) for item in deposits}
            withdraws_dict = {item['period_date']: float(item['total']) for item in withdraws}
            
            # Generate full date range
            labels = []
            deposits_data = []
            withdraws_data = []
            balance_data = []
            
            current_date = start_date
            running_balance = 0.0
            
            while current_date <= end_date:
                # Get the period key based on period
                if period == 'daily':
                    period_key = current_date
                    label = current_date.strftime('%Y-%m-%d')
                elif period == 'weekly':
                    # Get the week start date
                    week_start = current_date - timedelta(days=current_date.weekday())
                    period_key = week_start
                    label = f"الأسبوع {current_date.isocalendar()[1]}"
                else:  # monthly
                    # Get the month start date
                    month_start = current_date.replace(day=1)
                    period_key = month_start
                    label = current_date.strftime('%Y-%m')
                
                labels.append(label)
                
                # Get data for this period
                deposit_amount = deposits_dict.get(period_key, 0.0)
                withdraw_amount = withdraws_dict.get(period_key, 0.0)
                
                deposits_data.append(deposit_amount)
                withdraws_data.append(withdraw_amount)
                
                running_balance += deposit_amount - withdraw_amount
                balance_data.append(running_balance)
                
                # Move to next day
                current_date += timedelta(days=1)
            
            data = {
                'labels': labels,
                'deposits': deposits_data,
                'withdraws': withdraws_data,
                'balance': balance_data,
            }
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"Error in DashboardChartView: {str(e)}\n{error_details}")
            return Response(
                {'error': f'Failed to fetch chart data: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DashboardRecentTransactionsView(APIView):
    """View to get recent transactions for dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            limit = request.query_params.get('limit', 10)
            try:
                limit = int(limit)
            except ValueError:
                limit = 10
                
            transactions = Transaction.objects.all().order_by('-transaction_date')[:limit]
            
            serializer = DashboardTransactionSerializer(transactions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in DashboardRecentTransactionsView: {str(e)}")
            return Response(
                {'error': 'Failed to fetch recent transactions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# -------------------------------------
# Customer-Twilio
#----------------------------------------

class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Customer CRUD operations with custom SMS action
    """
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer

    @action(detail=False, methods=['post'], url_path='send-sms')
    def send_sms(self, request):
        """
        Custom endpoint to send SMS to a customer
        POST /api/customers/send-sms/
        Body: {"customer_id": 1, "message": "Broker City Properties. Your integrated digital real estate platform!"}
        """
        serializer = SMSSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer_id = serializer.validated_data['customer_id']
        message_body = serializer.validated_data['message']
        
        try:
            customer = Customer.objects.get(id=customer_id)
            message_sid = self._send_twilio_sms(customer.phone_number, message_body)
            
            return Response({
                'success': True,
                'message': f'SMS sent to {customer.name}',
                'message_sid': message_sid
            }, status=status.HTTP_200_OK)
            
        except Customer.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Customer not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _send_twilio_sms(self, phone_number, message_body):
        """
        Helper method to send SMS via Twilio
        """
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        return message.sid

    # Optional: Send SMS automatically when creating a customer
    def perform_create(self, serializer):
        """Override create to send welcome SMS when customer is added"""
        customer = serializer.save()
        try:
            self._send_twilio_sms(
                customer.phone_number,
                f"Welcome {customer.name}! You're now registered."
            )
        except Exception as e:
            # Log error but don't fail the creation
            print(f"Welcome SMS failed: {e}")


#############################################################
# Properties Management
#############################################################


# ============================================================
# CREATE OWNER
# POST /api/owners/create/
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_owner(request):

    serializer = OwnerSerializer(data=request.data)

    if serializer.is_valid():
        owner = serializer.save()

        return Response(
            {
                'message': 'Owner created successfully.',
                'owner': OwnerSerializer(owner).data
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        {
            'message': 'Failed to create owner.',
            'errors': serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )

# ============================================================
# FETCH ALL OWNERS
# GET /api/owners/
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_owners(request):

    owners = Owner.objects.all().order_by('-created_at')

    serializer = OwnerSerializer(
        owners,
        many=True
    )

    return Response(
        {
            'count': owners.count(),
            'owners': serializer.data
        },
        status=status.HTTP_200_OK
    )


# ============================================================
# FETCH OWNER DETAILS
# GET /api/owners/<id>/
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_owner_details(request, pk):

    try:
        owner = Owner.objects.get(pk=pk)

    except Owner.DoesNotExist:
        return Response(
            {
                'message': 'Owner not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = OwnerSerializer(owner)

    return Response(
        {
            'owner': serializer.data
        },
        status=status.HTTP_200_OK
    )


# ============================================================
# UPDATE OWNER
# PUT /api/owners/<id>/update/
# PATCH /api/owners/<id>/update/
# ============================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_owner(request, pk):

    try:
        owner = Owner.objects.get(pk=pk)

    except Owner.DoesNotExist:
        return Response(
            {
                'message': 'Owner not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # PATCH allows partial updates.
    # PUT requires the complete object.
    partial = request.method == 'PATCH'

    serializer = OwnerSerializer(
        owner,
        data=request.data,
        partial=partial
    )

    if serializer.is_valid():

        owner = serializer.save()

        return Response(
            {
                'message': 'Owner updated successfully.',
                'owner': OwnerSerializer(owner).data
            },
            status=status.HTTP_200_OK
        )

    return Response(
        {
            'message': 'Failed to update owner.',
            'errors': serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )


# ============================================================
# DELETE OWNER
# DELETE /api/owners/<id>/delete/
# ============================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_owner(request, pk):

    try:
        owner = Owner.objects.get(pk=pk)

    except Owner.DoesNotExist:
        return Response(
            {
                'message': 'Owner not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    owner.delete()

    return Response(
        {
            'message': 'Owner deleted successfully.'
        },
        status=status.HTTP_200_OK
    )


#####################################
# Buildings
#####################################
# ============================================================
# CREATE BUILDING
# POST /api/buildings/create/
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_building(request):

    serializer = BuildingSerializer(
        data=request.data
    )

    if serializer.is_valid():
        building = serializer.save()

        return Response(
            {
                'message': 'Building created successfully.',
                'building': BuildingSerializer(building).data
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        {
            'message': 'Failed to create building.',
            'errors': serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )


# ============================================================
# FETCH ALL BUILDING
# GET /api/buildings/
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_buildings(request):

    buildings = (
        Building.objects
        .select_related('owner')
        .all()
        .order_by('-created_at')
    )

    serializer = BuildingSerializer(
        buildings,
        many=True
    )

    return Response(
        {
            'count': buildings.count(),
            'buildings': serializer.data
        },
        status=status.HTTP_200_OK
    )


# ============================================================
# FETCH BUILDING DETAILS
# GET /api/buildings/<id>/
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_building_details(request, pk):

    try:
        building = (
            Building.objects
            .select_related('owner')
            .get(pk=pk)
        )

    except Building.DoesNotExist:
        return Response(
            {
                'message': 'Building not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = BuildingSerializer(building)

    return Response(
        {
            'building': serializer.data
        },
        status=status.HTTP_200_OK
    )


# ============================================================
# UPDATE Building
# PUT /api/buildings/<id>/update/
# PATCH /api/buildings/<id>/update/
# ============================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_building(request, pk):

    try:
        building = Building.objects.get(pk=pk)

    except Building.DoesNotExist:
        return Response(
            {
                'message': 'Building not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    partial = request.method == 'PATCH'

    serializer = BuildingSerializer(
        building,
        data=request.data,
        partial=partial
    )

    if serializer.is_valid():

        building = serializer.save()

        return Response(
            {
                'message': 'Building updated successfully.',
                'building': BuildingSerializer(building).data
            },
            status=status.HTTP_200_OK
        )

    return Response(
        {
            'message': 'Failed to update building.',
            'errors': serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )


# ============================================================
# DELETE BUILDING
# DELETE /api//buildings/<id>/delete/
# ============================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_building(request, pk):

    try:
        building = Building.objects.get(pk=pk)

    except Building.DoesNotExist:
        return Response(
            {
                'message': 'Building not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    building.delete()

    return Response(
        {
            'message': 'Building deleted successfully.'
        },
        status=status.HTTP_200_OK
    )

# ===================================
# Twilio Whatsup Messages WITH message_body
# ===================================

# class SendWhatsAppView(APIView):
#     def post(self, request):
#         serializer = SendWhatsAppSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)

#         to_number = serializer.validated_data['to_number']
#         message_body = serializer.validated_data['message_body']

#         # Create a pending record first
#         msg_record = WhatsAppMessage.objects.create(
#             to_number=to_number,
#             message_body=message_body,
#             status='pending'
#         )

#         try:
#             client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
#             message = client.messages.create(
#                 body=message_body,
#                 from_=settings.TWILIO_PHONE_NUMBER,  # e.g. whatsapp:+14155238886
#                 to=f"whatsapp:{to_number}"
#             )
#             msg_record.status = 'sent'
#             msg_record.twilio_sid = message.sid
#             msg_record.save()

#             return Response(WhatsAppMessageSerializer(msg_record).data, status=status.HTTP_201_CREATED)

#         except TwilioRestException as e:
#             msg_record.status = 'failed'
#             msg_record.error_message = str(e)
#             msg_record.save()

#             return Response(
#                 {"error": str(e), "record": WhatsAppMessageSerializer(msg_record).data},
#                 status=status.HTTP_400_BAD_REQUEST
#             )


# class WhatsAppMessageListView(generics.ListAPIView):
#     """View history of sent messages."""
#     queryset = WhatsAppMessage.objects.all().order_by('-created_at')
#     serializer_class = WhatsAppMessageSerializer


# class WhatsAppWebhookView(APIView):
#     """Handles incoming WhatsApp messages from Twilio (replies from users)."""
#     def post(self, request):
#         incoming_msg = request.data.get('Body', '')
#         from_number = request.data.get('From', '')

#         print(f"Received from {from_number}: {incoming_msg}")
#         # TODO: process/store incoming message as needed

#         return Response(status=status.HTTP_200_OK)


# ===================================
# Twilio Whatsup without message_body
# ===================================


class SendWhatsAppView(APIView):
    #DEFAULT_MESSAGE = "🏢 Broker City Properties. Your integrated digital real estate platform" # <-- set your fixed text here
    DEFAULT_MESSAGE = "🏙️ *بروكر سيتي العقارية*\nمنصتك العقارية الرقمية المتكاملة"
#     message = client.messages.create(
#     body=message_body,
#     media_url=["https://yourdomain.com/static/logo.png"],  # must be a public URL
#     from_=settings.TWILIO_PHONE_NUMBER,
#     to=f"whatsapp:{to_number}"
# )
    
    def post(self, request):
        serializer = SendWhatsAppSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        to_number = serializer.validated_data['to_number']
        message_body = self.DEFAULT_MESSAGE

        msg_record = WhatsAppMessage.objects.create(
            to_number=to_number,
            message_body=message_body,
            status='pending'
        )

        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message_body,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=f"whatsapp:{to_number}"
            )
            msg_record.status = 'sent'
            msg_record.twilio_sid = message.sid
            msg_record.save()

            return Response(WhatsAppMessageSerializer(msg_record).data, status=status.HTTP_201_CREATED)

        except TwilioRestException as e:
            msg_record.status = 'failed'
            msg_record.error_message = str(e)
            msg_record.save()

            return Response(
                {"error": str(e), "record": WhatsAppMessageSerializer(msg_record).data},
                status=status.HTTP_400_BAD_REQUEST
            )


class WhatsAppMessageListView(generics.ListAPIView):
    """View history of sent messages."""
    queryset = WhatsAppMessage.objects.all().order_by('-created_at')
    serializer_class = WhatsAppMessageSerializer


class WhatsAppWebhookView(APIView):
    """Handles incoming WhatsApp messages from Twilio (replies from users)."""
    def post(self, request):
        incoming_msg = request.data.get('Body', '')
        from_number = request.data.get('From', '')

        print(f"Received from {from_number}: {incoming_msg}")

        return Response(status=status.HTTP_200_OK)

#============================================
#  Unit Views
#============================================
# ============================================================
# CREATE UNIT
# POST /api/units/create/
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_unit(request):

    serializer = UnitSerializer(
        data=request.data
    )

    if serializer.is_valid():

        unit = serializer.save()

        # Re-fetch with related objects
        unit = (
            Unit.objects
            .select_related(
                'category',
                'category__owner',
            )
            .get(pk=unit.pk)
        )

        return Response(
            {
                'message': 'Unit created successfully.',
                'unit': UnitSerializer(unit).data
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        {
            'message': 'Failed to create unit.',
            'errors': serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )
# ============================================================
# FETCH ALL UNITS
# GET /api/units/
# ============================================================

# ============================================================
# FETCH ALL UNITS
# GET /api/units/
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_units(request):

    units = (
        Unit.objects
        .select_related(
            'category',
            'category__owner',
        )
        .all()
        .order_by('-created_at')
    )

    serializer = UnitSerializer(units, many=True)

    return Response(
        {
            'count': units.count(),
            'units': serializer.data
        },
        status=status.HTTP_200_OK
    )


# ============================================================
# FETCH UNIT DETAILS
# GET /api/units/<id>/
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unit_details(request, pk):

    try:

        unit = (
            Unit.objects
            .select_related(
                'category',
                'category__owner',
            )
            .get(pk=pk)
        )

    except Unit.DoesNotExist:

        return Response(
            {
                'message': 'Unit not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = UnitSerializer(unit)

    return Response(
        {
            'unit': serializer.data
        },
        status=status.HTTP_200_OK
    )

# ============================================================
# UPDATE UNIT
# PUT /api/units/<id>/update/
# PATCH /api/units/<id>/update/
# ============================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_unit(request, pk):

    try:
        unit = Unit.objects.get(pk=pk)

    except Unit.DoesNotExist:

        return Response(
            {
                'message': 'Unit not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    partial = request.method == 'PATCH'

    serializer = UnitSerializer(
        unit,
        data=request.data,
        partial=partial
    )

    if serializer.is_valid():

        unit = serializer.save()

        # Re-fetch with related objects
        unit = (
            Unit.objects
            .select_related(
                'category',
                'category__owner',
            )
            .get(pk=unit.pk)
        )

        return Response(
            {
                'message': 'Unit updated successfully.',
                'unit': UnitSerializer(unit).data
            },
            status=status.HTTP_200_OK
        )

    return Response(
        {
            'message': 'Failed to update unit.',
            'errors': serializer.errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )

# ============================================================
# DELETE UNIT
# DELETE /api/units/<id>/delete/
# ============================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_unit(request, pk):

    try:

        unit = Unit.objects.get(pk=pk)

    except Unit.DoesNotExist:

        return Response(
            {
                'message': 'Unit not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    unit.delete()

    return Response(
        {
            'message': 'Unit deleted successfully.'
        },
        status=status.HTTP_200_OK
    )


###################################
# Rental 
###################################
# from rest_framework.decorators import (
#     api_view,
#     permission_classes,
# )
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status

# from .models import Rental
# from .serializers import RentalSerializer


# ============================================================
# CREATE RENTAL
# POST /api/rentals/create/
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_rental(request):

    serializer = RentalSerializer(data=request.data)

    if serializer.is_valid():

        rental = serializer.save()

        return Response(
            {
                'message': 'Rental created successfully.',
                'rental': RentalSerializer(rental).data,
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        {
            'message': 'Failed to create rental.',
            'errors': serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST
    )


# ============================================================
# FETCH ALL RENTALS
# GET /api/rentals/
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_rentals(request):

    rentals = (
        Rental.objects
        .all()
        .order_by('-id')
    )

    serializer = RentalSerializer(rentals, many=True)

    return Response(
        {
            'count': rentals.count(),
            'rentals': serializer.data,
        },
        status=status.HTTP_200_OK
    )


# ============================================================
# FETCH RENTAL DETAILS
# GET /api/rentals/<pk>/
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rental_details(request, pk):

    try:
        rental = Rental.objects.get(pk=pk)

    except Rental.DoesNotExist:

        return Response(
            {'message': 'Rental not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = RentalSerializer(rental)

    return Response(
        {'rental': serializer.data},
        status=status.HTTP_200_OK
    )


# ============================================================
# UPDATE RENTAL
# PUT /api/rentals/<pk>/update/
# PATCH /api/rentals/<pk>/update/
# ============================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_rental(request, pk):

    try:
        rental = Rental.objects.get(pk=pk)

    except Rental.DoesNotExist:

        return Response(
            {'message': 'Rental not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    partial = request.method == 'PATCH'

    serializer = RentalSerializer(
        rental,
        data=request.data,
        partial=partial,
    )

    if serializer.is_valid():

        rental = serializer.save()

        return Response(
            {
                'message': 'Rental updated successfully.',
                'rental': RentalSerializer(rental).data,
            },
            status=status.HTTP_200_OK
        )

    return Response(
        {
            'message': 'Failed to update rental.',
            'errors': serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST
    )


# ============================================================
# DELETE RENTAL
# DELETE /api/rentals/<pk>/delete/
# ============================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_rental(request, pk):

    try:
        rental = Rental.objects.get(pk=pk)

    except Rental.DoesNotExist:

        return Response(
            {'message': 'Rental not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    rental.delete()

    return Response(
        {'message': 'Rental deleted successfully.'},
        status=status.HTTP_200_OK
    )



############################WEBSITE###########################
##############################################################
class SliderListCreateView(generics.ListCreateAPIView):
    queryset = Slider.objects.all().order_by('-id')
    serializer_class = SliderSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class SliderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Slider.objects.all()
    serializer_class = SliderSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


#=============================================================
# Developer
#=============================================================
# ---------- LIST + CREATE ----------
class DeveloperListCreateView(generics.ListCreateAPIView):
    queryset = Developer.objects.all().order_by('-id')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DeveloperSerializer
        return DeveloperSerializer


# ---------- RETRIEVE + UPDATE + DELETE ----------
class DeveloperDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Developer.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DeveloperDetailSerializer
        return DeveloperSerializer



# =============================================================
# NEW: Send Bulk Email
# =============================================================

# class SendBulkEmailView(APIView):
#     """
#     POST /api/developers/send-email/

#     Body:
#     {
#         "subject": "...",
#         "message": "...",
#         "recipient_ids": [1, 2, 3]
#     }

#     The backend:
#     1. Validates the payload.
#     2. Loads the selected Developer records.
#     3. Filters out records without a valid email.
#     4. Sends one email per recipient (BCC/CC optional).
#     5. Returns a per-recipient status report.
#     """
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         serializer = SendEmailSerializer(data=request.data)

#         if not serializer.is_valid():
#             return Response(
#                 serializer.errors,
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         data = serializer.validated_data
#         subject = data['subject']
#         message = data['message']
#         recipient_ids = data['recipient_ids']

#         # Load only the developers that were selected AND have an email
#         developers = (
#             Developer.objects
#             .filter(id__in=recipient_ids)
#             .exclude(email__isnull=True)
#             .exclude(email__exact='')
#         )

#         if not developers.exists():
#             return Response(
#                 {'detail': 'لا يوجد أي مطور محدد لديه بريد إلكتروني صالح'},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         from_email = settings.DEFAULT_FROM_EMAIL

#         sent = []
#         failed = []

#         # Use a single connection for all sends — much faster than
#         # opening a new SMTP connection per message.
#         connection = get_connection(fail_silently=False)

#         try:
#             connection.open()

#             for dev in developers:
#                 try:
#                     send_mail(
#                         subject=subject,
#                         message=message,
#                         from_email=from_email,
#                         recipient_list=[dev.email],
#                         fail_silently=False,
#                         connection=connection,
#                     )
#                     sent.append({
#                         'id': dev.id,
#                         'name': dev.name or '',
#                         'email': dev.email,
#                     })
#                 except Exception as e:
#                     failed.append({
#                         'id': dev.id,
#                         'name': dev.name or '',
#                         'email': dev.email,
#                         'error': str(e),
#                     })
#         finally:
#             try:
#                 connection.close()
#             except Exception:
#                 pass

#         response_payload = {
#             'status': 'success' if sent else 'error',
#             'sent_count': len(sent),
#             'failed_count': len(failed),
#             'sent': sent,
#             'failed': failed,
#         }

#         # If nothing sent → 500, if partial → 200 with errors listed
#         http_status = (
#             status.HTTP_200_OK
#             if sent
#             else status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

#         return Response(response_payload, status=http_status)


class SendBulkEmailView(APIView):
    """
    POST /api/developers/send-email/

    Body:
    {
        "subject": "...",
        "message": "...",
        "recipient_ids": [1, 2, 3]
    }

    Uses Anymail (Mailgun) — no persistent SMTP connection needed.
    Each send_mail() call makes one HTTPS request to the Mailgun API.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendEmailSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        subject = data['subject']
        message = data['message']
        recipient_ids = data['recipient_ids']

        # Load only the developers that were selected AND have an email
        developers = (
            Developer.objects
            .filter(id__in=recipient_ids)
            .exclude(email__isnull=True)
            .exclude(email__exact='')
        )

        if not developers.exists():
            return Response(
                {'detail': 'لا يوجد أي مطور محدد لديه بريد إلكتروني صالح'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from_email = settings.DEFAULT_FROM_EMAIL

        logger.info(
            f"Bulk email start | from={from_email} | "
            f"subject={subject!r} | recipients={developers.count()}"
        )

        sent = []
        failed = []

        for dev in developers:
            try:
                # ✅ Simple send_mail — Anymail handles the transport
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=from_email,
                    recipient_list=[dev.email],
                    fail_silently=False,
                    # ⚠️ DO NOT pass connection=... with Anymail
                )
                sent.append({
                    'id': dev.id,
                    'name': dev.name or '',
                    'email': dev.email,
                })
                logger.info(f"✅ Sent to {dev.email}")

            except Exception as e:
                logger.error(
                    f"❌ Failed to send to {dev.email}: {e}",
                    exc_info=True,
                )
                failed.append({
                    'id': dev.id,
                    'name': dev.name or '',
                    'email': dev.email,
                    'error': str(e),
                })

        response_payload = {
            'status': 'success' if sent else 'error',
            'sent_count': len(sent),
            'failed_count': len(failed),
            'sent': sent,
            'failed': failed,
        }

        http_status = (
            status.HTTP_200_OK
            if sent
            else status.HTTP_500_INTERNAL_SERVER_ERROR
        )

        return Response(response_payload, status=http_status)

# =============================================================
# OPTIONAL: Test endpoint (keep your existing one)
# =============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_email_view(request):
    try:
        send_mail(
            subject="Test from Broker's City",
            message=(
                "Broker City Properties welcomes you. "
                "If you received this in your inbox (not spam), "
                "everything is working!"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["mohammad-alahmad@brokerscity.ae"],
            fail_silently=False,
        )
        return Response({"status": "success", "message": "Email sent!"})
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

        

#==========Offersale

# =========================================================
# LIST  +  CREATE
# =========================================================
class OffersaleListCreateView(APIView):
    """
    GET  /api/offersales/         → list all offers
    POST /api/offersales/         → create a new offer
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        queryset = Offersale.objects.all().order_by("-id")
        serializer = OffersaleListSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = OffersaleSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# =========================================================
# FETCH DETAIL
# =========================================================
class OffersaleDetailView(APIView):
    """
    GET /api/offersales/<pk>/     → retrieve one offer
    """
    def get(self, request, pk):
        try:
            obj = Offersale.objects.get(pk=pk)
        except Offersale.DoesNotExist:
            return Response(
                {"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = OffersaleSerializer(
            obj, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)



# =========================================================
# UPDATE  +  DELETE
# =========================================================
class OffersaleUpdateDeleteView(APIView):
    """
    PUT    /api/offersales/<pk>/   → full update
    PATCH  /api/offersales/<pk>/   → partial update
    DELETE /api/offersales/<pk>/   → delete
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        try:
            return Offersale.objects.get(pk=pk)
        except Offersale.DoesNotExist:
            return None

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = OffersaleSerializer(
            obj, data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = OffersaleSerializer(
            obj, data=request.data, partial=True,
            context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )
        obj.delete()
        return Response(
            {"detail": "Deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


######################################
# Payment Plan
######################################

# =========================================================
# LIST  +  CREATE
# =========================================================
class PaymentPlanListCreateView(APIView):
    """
    GET  /api/payment-plans/         → list all payment plans
    POST /api/payment-plans/         → create a new payment plan
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        queryset = (
            PaymentPlan.objects
            .select_related("unit_no")
            .all()
            .order_by("-id")
        )
        serializer = PaymentPlanSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PaymentPlanSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================================================
# UPDATE  +  DELETE
# =========================================================
class PaymentPlanUpdateDeleteView(APIView):
    """
    PUT    /api/payment-plans/<pk>/   → full update
    PATCH  /api/payment-plans/<pk>/   → partial update
    DELETE /api/payment-plans/<pk>/   → delete
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        try:
            return PaymentPlan.objects.get(pk=pk)
        except PaymentPlan.DoesNotExist:
            return None

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = PaymentPlanSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = PaymentPlanSerializer(
            obj, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(
                {"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND
            )
        obj.delete()
        return Response(
            {"detail": "Deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


################################
# Monitoring
################################

# ---------- Pagination ----------
# ============================================================
#  MONITOR — Pagination, Filters, CRUD endpoints
# ============================================================

class MonitorPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200


# ---------- Helpers ----------
def _parse_date(value, field_name):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise ValueError(f"Invalid {field_name} format. Use YYYY-MM-DD.")


def _clean_payload(data):
    """
    Convert empty strings to None for all fields, and drop keys whose
    value is None for optional fields (so the serializer uses its default).
    Keeps the request tolerant of partial payloads from the frontend.
    """
    if not isinstance(data, dict):
        return data

    cleaned = {}
    for k, v in data.items():
        if isinstance(v, str) and v.strip() == "":
            cleaned[k] = None
        else:
            cleaned[k] = v
    return cleaned


def _apply_monitor_filters(queryset, request):
    search = request.query_params.get('search')
    if search:
        q = Q(agent__icontains=search) | Q(draws_cause__icontains=search)
        if search.isdigit():
            num = int(search)
            q |= (
                Q(lead_no=num)
                | Q(lead_reassigned_no=num)
                | Q(agent_lead_no=num)
                | Q(draws_no=num)
            )
        queryset = queryset.filter(q)

    day = request.query_params.get('day') or request.query_params.get('date')
    if day:
        queryset = queryset.filter(date=_parse_date(day, "day"))

    month = request.query_params.get('month')
    if month:
        queryset = queryset.filter(month__iexact=month)

    from_date = request.query_params.get('from_date')
    to_date = request.query_params.get('to_date')
    if from_date and to_date:
        start = _parse_date(from_date, "from_date")
        end = _parse_date(to_date, "to_date")
        if start > end:
            raise ValueError("from_date cannot be after to_date.")
        queryset = queryset.filter(date__range=(start, end))
    elif from_date:
        queryset = queryset.filter(
            date__gte=_parse_date(from_date, "from_date")
        )
    elif to_date:
        queryset = queryset.filter(
            date__lte=_parse_date(to_date, "to_date")
        )

    return queryset


# ---------- CREATE ----------
@api_view(['POST'])
def monitor_create(request):
    # Normalize empty strings to None first
    payload = _clean_payload(request.data)

    serializer = MonitorCreateSerializer(data=payload)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {
                "message": "Monitor created successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    # Print the exact errors to your server console for debugging
    print("Monitor create validation errors:", serializer.errors)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------- DELETE ----------
@api_view(['DELETE'])
def monitor_delete(request, pk):
    try:
        obj = Monitor.objects.get(pk=pk)
    except Monitor.DoesNotExist:
        return Response(
            {"error": "Monitor not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    obj.delete()
    return Response(
        {"message": "Monitor deleted successfully."},
        status=status.HTTP_200_OK,
    )


# ---------- LIST ----------
@api_view(['GET'])
def monitor_list(request):
    queryset = Monitor.objects.all().order_by('-created_at')
    try:
        queryset = _apply_monitor_filters(queryset, request)
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    paginator = MonitorPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = MonitorSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


# ---------- DETAIL ----------
@api_view(['GET'])
def monitor_detail(request, pk):
    try:
        obj = Monitor.objects.get(pk=pk)
    except Monitor.DoesNotExist:
        return Response(
            {"error": "Monitor not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = MonitorSerializer(obj)
    return Response(serializer.data, status=status.HTTP_200_OK)