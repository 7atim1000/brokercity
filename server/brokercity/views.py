from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .models import Profile, CashBox, Bank, Transaction, Account, AccountCategory
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
    DashboardTransactionSerializer

    )

# Dashboard
import logging

logger = logging.getLogger(__name__)


# Pagination
# from .pagination import ProjectPagination
from rest_framework.pagination import PageNumberPagination

# server/brokercity/views.py
import logging
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User


# Create your views here.

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
    - Deposit + Banks: account_from, bank
    - Deposit + Cash: account_from, cashbox
    - Withdraw + Banks: account_to, bank
    - Withdraw + Cash: account_to, cashbox
    
    Example - Deposit via Bank:
    {
        "type": "deposit",
        "payment_method": "banks",
        "account_from": 1,
        "bank": 1,
        "amount": "1500.00",
        "transaction_date": "2024-01-15",
        "statement": "Salary deposit",
        "currency": "AED",
        "amount_to_arabic": "ألف وخمسمائة درهم إماراتي فقط لا غير",
        "amount_to_english": "One thousand five hundred UAE Dirhams only"
    }
    """
    # serializer_class = TransactionCreateUpdateSerializer
    # permission_classes = [IsAuthenticated]
    
    # def perform_create(self, serializer):
    #     serializer.save(transaction_user=self.request.user)

    queryset = Transaction.objects.all()
    serializer_class = TransactionCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    

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
            print(f"=== SERIALIZER ERRORS ===")
            print(f"Errors: {serializer.errors}")
            print(f"Validated data before errors: {serializer.validated_data}")
            print("=" * 80)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"=== SERIALIZER VALIDATED DATA ===")
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
        #payment_method
        print(f"Payment Method: {transaction.payment_method}")
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
                
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            # Get all transactions in date range
            transactions = Transaction.objects.filter(
                transaction_date__gte=start_date,
                transaction_date__lte=end_date
            )
            
            # Calculate totals
            total_deposits = transactions.filter(type='deposit').aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            total_withdraws = transactions.filter(type='withdraw').aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            total_balance = total_deposits - total_withdraws
            
            deposit_count = transactions.filter(type='deposit').count()
            withdraw_count = transactions.filter(type='withdraw').count()
            total_transactions = transactions.count()
            
            data = {
                'total_deposits': total_deposits,
                'total_withdraws': total_withdraws,
                'total_balance': total_balance,
                'total_transactions': total_transactions,
                'deposit_count': deposit_count,
                'withdraw_count': withdraw_count,
            }
            
            serializer = DashboardSummarySerializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
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
            # Get period (daily, weekly, monthly)
            period = request.query_params.get('period', 'daily')
            
            # Get date range
            days = request.query_params.get('days', 30)
            try:
                days = int(days)
            except ValueError:
                days = 30
                
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days)
            
            # Generate labels and data
            labels = []
            deposits_data = []
            withdraws_data = []
            balance_data = []
            
            current_date = start_date
            running_balance = 0
            
            while current_date <= end_date:
                # Format label based on period
                if period == 'daily':
                    label = current_date.strftime('%Y-%m-%d')
                elif period == 'weekly':
                    label = f"الأسبوع {current_date.isocalendar()[1]}"
                else:  # monthly
                    label = current_date.strftime('%Y-%m')
                
                labels.append(label)
                
                # Get transactions for this date
                if period == 'daily':
                    day_transactions = Transaction.objects.filter(
                        transaction_date__date=current_date
                    )
                elif period == 'weekly':
                    week_start = current_date - timedelta(days=current_date.weekday())
                    week_end = week_start + timedelta(days=6)
                    day_transactions = Transaction.objects.filter(
                        transaction_date__date__gte=week_start,
                        transaction_date__date__lte=week_end
                    )
                else:  # monthly
                    day_transactions = Transaction.objects.filter(
                        transaction_date__year=current_date.year,
                        transaction_date__month=current_date.month
                    )
                
                daily_deposits = day_transactions.filter(type='deposit').aggregate(
                    total=Sum('amount')
                )['total'] or 0
                
                daily_withdraws = day_transactions.filter(type='withdraw').aggregate(
                    total=Sum('amount')
                )['total'] or 0
                
                deposits_data.append(float(daily_deposits))
                withdraws_data.append(float(daily_withdraws))
                
                running_balance += daily_deposits - daily_withdraws
                balance_data.append(float(running_balance))
                
                current_date += timedelta(days=1)
            
            data = {
                'labels': labels,
                'deposits': deposits_data,
                'withdraws': withdraws_data,
                'balance': balance_data,
            }
            
            serializer = DashboardChartSerializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in DashboardChartView: {str(e)}")
            return Response(
                {'error': 'Failed to fetch chart data'},
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