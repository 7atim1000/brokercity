# crm/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from rest_framework.pagination import PageNumberPagination
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

import uuid
from django.utils import timezone



# Authentication
class Profile(models.Model):
    USER = 'user'
    VENDOR = 'vendor'
    PROSPECT = 'prospect'  # Add PROSPECT if you need it

    ROLE_CHOICES = [
        (USER, 'User'),
        (VENDOR, 'Vendor'),
        (PROSPECT, 'Prospect'),  # Add this if needed
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=USER  # Or PROSPECT if that's your default
    )

    def __str__(self):
        return self.user.username



###############################################################
# Bank Model
###############################################################
class Bank(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Name of the bank"
    )
    
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        help_text="Current balance of the bank"
    )
    
    balance_opening = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        help_text="Opening balance of the bank"
    )
    
    currency = models.CharField(
        max_length=3,
        default='SAR',
        choices=[
            ('AED', 'UAE Dirham'),
            ('USD', 'US Dollar'),
            ('EUR', 'Euro'),
            ('SAR', 'Saudi Riyal'),
        ],
        help_text="Currency of the account"
    )
    
    account_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Bank account number"
    )
    
    iban = models.CharField(
        max_length=34,
        blank=True,
        null=True,
        help_text="International Bank Account Number"
    )
    
    swift_code = models.CharField(
        max_length=11,
        blank=True,
        null=True,
        help_text="SWIFT/BIC code"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the bank account is active"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Date and time when the bank was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Date and time when the bank was last updated"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about the bank"
    )


###############################################################
# Cash Box Model
###############################################################
class CashBox(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Name of the cash box"
    )
    
    balance_opening = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        help_text="Opening balance of the cash box"
    )
    
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        help_text="Current balance of the cash box"
    )
    
    currency = models.CharField(
        max_length=3,
        default='SAR',
        choices=[
            ('AED', 'UAE Dirham'),
            ('USD', 'US Dollar'),
            ('EUR', 'Euro'),
            ('SAR', 'Saudi Riyal'),
        ],
        help_text="Currency of the cash box"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the cash box is active"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Date and time when created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Date and time when last updated"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about the cash box"
    )



###############################################################
# Accounts and Categories Model
###############################################################
class AccountCategory(models.Model):
    name = models.CharField(
        max_length=100,
        help_text="Name of the payment method"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Date and time when created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Date and time when last updated"
    )
    
    def __str__(self):
        return self.name
    
    


class Account(models.Model):
    EXPENSES = "expenses"
    REVENUES = "revenues"
    
    TYPE_CHOICES = [
        (EXPENSES, "Expenses"),  # Better display names
        (REVENUES, "Revenues"),
    ]
    
    name = models.CharField(
        max_length=100,
        help_text="Name of the payment method"
    )
    
    type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
    )
    
    category = models.ForeignKey(
    AccountCategory,
    on_delete=models.PROTECT,  # Prevents deletion if accounts exist
    related_name="accounts",
    help_text="Categories of account"
)
# No null=True, no blank=True - field is required OR use CASCADE
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Date and time when created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Date and time when last updated"
    )
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    

###############################################################
# Transaction Model
###############################################################
from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User


def generate_default_transaction_no():
    """Generate default transaction number starting from 101"""
    try:
        last_transaction = Transaction.objects.order_by('-id').first()
        if last_transaction and last_transaction.transaction_no:
            try:
                last_no = int(last_transaction.transaction_no)
                return str(last_no + 1)
            except (ValueError, TypeError):
                return '101'
        return '101'
    except Exception:
        return '101'







def generate_default_transaction_no():
    """Generate a shorter transaction number (max 20 chars)"""
    # Format: TRX-YYMMDD-XXXX (14 characters)
    timestamp = timezone.now().strftime('%y%m%d')
    random_num = uuid.uuid4().hex[:4].upper()
    return f"TRX-{timestamp}-{random_num}"  # e.g., TRX-240831-A1B2 (14 chars)

class Transaction(models.Model):
    WITHDRAW = "withdraw"
    DEPOSIT = "deposit"
    
    BANKS = "banks"
    CASH = "cash"
    
    TYPE_CHOICES = [
        (DEPOSIT, "Deposit / Income"),
        (WITHDRAW, "Withdraw / Expense"),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        (BANKS, "Banks"),
        (CASH, "Cash"),
    ]
    
    # Auto-generated transaction number - ensure it's not longer than 20 chars
    transaction_no = models.CharField(
        max_length=20,  # Keep as 20
        unique=True,
        editable=False,
        default=generate_default_transaction_no,
        help_text="Auto-generated transaction number"
    )
    
    transaction_date = models.DateField(
        help_text="Date of the transaction"
    )
    
    type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        help_text="Type of transaction (deposit or withdraw)"
    )
    
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0.01)],
        help_text="Transaction amount"
    )
    
    amount_deposit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0.01)],
        help_text="Deposit amount"
    )
    
    amount_withdraw = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0.01)],
        help_text="Withdraw amount"
    )
    
    amount_to_arabic = models.CharField(
        max_length=255,  # Increased to 255 to avoid truncation
        help_text="Amount number to arabic language",
        blank=True,
        null=True
    )
    amount_to_english = models.CharField(
        max_length=255,  # Increased to 255 to avoid truncation
        help_text="Amount number to english language",
        blank=True,
        null=True
    )
    
    currency = models.CharField(
        max_length=10,
        default="AED",
        choices=[
            ('AED', 'UAE Dirham'),
            ('USD', 'US Dollar'),
            ('EUR', 'Euro'),
            ('SAR', 'Saudi Riyal'),
        ],
        help_text="Currency of the transaction"
    )
    
    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHOD_CHOICES,
        help_text="Type of payment (banks or cash)"
    )

    # Account From and To as CharFields
    account_from = models.CharField(
        max_length=255, 
        blank=True, 
        #null=True, 
        verbose_name="From Account"
    )
    account_to = models.CharField(
        max_length=255, 
        blank=True, 
        #null=True, 
        verbose_name="To Account"
    )
        
    # CashBox (used for Deposit via Cash or Withdraw via Cash)
    cashbox = models.ForeignKey(
        'CashBox',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
        help_text="CashBox used for Cash transactions"
    )
    
    # Bank field (required if payment_method is banks)
    bank = models.ForeignKey(
        'Bank',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions_bank",
        help_text="Bank used on this transaction (required if payment_method is banks)"
    )
    
    # Check-related fields
    has_check = models.BooleanField(
        default=False,
        help_text="Check if transaction has a check"
    )
    
    check_no = models.CharField(
        max_length=50,
        #null=True,
        blank=True,
        help_text="Check number"
    )
    
    check_bank = models.CharField(
        max_length=100,
        #null=True,
        blank=True,
        help_text="Bank name on the check"
    )
    
    check_date = models.DateField(
        #null=True,
        blank=True,
        help_text="Date on the check"
    )
    
    statement = models.CharField(
        max_length=100,
        help_text="Transaction description or statement"
    )
    
    # Person fields
    person_receipt = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Person who received the amount"
    )
    
    person_deliver = models.CharField(
        max_length=100,
        #null=True,
        blank=True,
        help_text="Person who delivered the amount"
    )
    
    # Signature fields (base64 encoded)
    user_signature = models.TextField(
        null=True,
        blank=True,
        help_text="Signature of the transaction user (base64 encoded)"
    )
    
    manager_signature = models.TextField(
        null=True,
        blank=True,
        help_text="Signature of the transaction manager (base64 encoded)"
    )
    
    second_person_signature = models.TextField(
        null=True,
        blank=True,
        help_text="Signature of the person who received the amount (base64 encoded)"
    )
    
    # Document fields
    has_document = models.BooleanField(
        default=False,
        help_text="Check if transaction has a document"
    )
    document = models.ImageField(
        upload_to='transactions/documents/',
        null=True,
        blank=True,
        help_text="Upload scanned document or receipt"
    )
    
    document_no = models.CharField(
        max_length=50,
        #null=True,
        blank=True,
        help_text="Document or reference number"
    )
    
    # User who created the transaction
    transaction_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions_created",
        help_text="User who created this transaction"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Date and time when the transaction was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Date and time when the transaction was last updated"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about the transaction"
    )
    
    def __str__(self):
        return f"{self.transaction_no} - {self.statement[:50]}"
    
    def save(self, *args, **kwargs):
        # Ensure transaction_no is not too long
        if self.transaction_no and len(self.transaction_no) > 20:
            # Truncate or regenerate
            self.transaction_no = self.transaction_no[:20]
        super().save(*args, **kwargs)
        
# created_at field WHEN migrations: 
# It is impossible to add the field 'created_at' with 'auto_now_add=True' to paymentmethod without providing a default.
# Please select a fix:
#  1) Provide a one-off default now which will be set on all existing rows
#  2) Quit and manually define a default value in models.py.
# Select an option: 
# Enter 1 and then use this default value:

# text
# timezone.now