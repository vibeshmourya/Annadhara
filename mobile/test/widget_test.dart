import 'package:flutter_test/flutter_test.dart';
import 'package:foodbridge_mobile/main.dart';
import 'package:foodbridge_mobile/models/user_model.dart';
import 'package:foodbridge_mobile/models/donation_model.dart';
import 'package:foodbridge_mobile/models/reservation_model.dart';
import 'package:foodbridge_mobile/models/pickup_model.dart';
import 'package:foodbridge_mobile/models/organization_model.dart';
import 'package:foodbridge_mobile/core/constants/india_constants.dart';

void main() {
  group('Annadhara Model Unit Tests', () {
    test('UserModel deserialization and role checks', () {
      final jsonDonor = {
        '_id': 'u1',
        'name': 'Green Bistro',
        'email': 'donor@greenbistro.com',
        'role': 'DONOR',
        'phone': '9876543210',
        'organization': {
          'name': 'Green Garden Bistro',
          'type': 'Restaurant',
          'verificationStatus': 'VERIFIED',
        },
      };

      final donor = UserModel.fromJson(jsonDonor);
      expect(donor.id, 'u1');
      expect(donor.name, 'Green Bistro');
      expect(donor.isDonor, true);
      expect(donor.isRecipient, false);
      expect(donor.isVolunteer, false);
      expect(donor.isAdmin, false);
      expect(donor.organizationName, 'Green Garden Bistro');
      expect(donor.verificationStatus, 'VERIFIED');

      final jsonRecipient = {
        'id': 'u2',
        'name': 'Hope Harvest NGO',
        'email': 'ngo@hopeharvest.org',
        'role': 'recipient', // test lowercase normalization
      };

      final recipient = UserModel.fromJson(jsonRecipient);
      expect(recipient.isRecipient, true);
      expect(recipient.role, 'RECIPIENT');
    });

    test('DonationModel deserialization with Indian localization fields', () {
      final jsonDonation = {
        '_id': 'don123',
        'title': '30 Portions Veggie Curry',
        'category': 'rice_meals',
        'dietaryType': 'veg',
        'description': 'Freshly prepared vegetarian curry with rice',
        'totalQuantity': 30,
        'availableQuantity': 20,
        'reservedQuantity': 10,
        'collectedQuantity': 0,
        'unit': 'meals',
        'storageHandling': 'hot_held',
        'allergens': ['dairy'],
        'fssaiNumber': '11223344556677',
        'fssaiDeclaration': true,
        'pickupLocation': {
          'address': {
            'street': '101 Market Lane',
            'areaLocality': 'Indiranagar',
            'city': 'Bengaluru',
            'district': 'Bengaluru Urban',
            'state': 'Karnataka',
            'postalCode': '560038',
            'country': 'India',
          },
        },
        'status': 'available',
        'donor': {
          'name': 'City Bistro',
        },
      };

      final donation = DonationModel.fromJson(jsonDonation);
      expect(donation.id, 'don123');
      expect(donation.title, '30 Portions Veggie Curry');
      expect(donation.category, 'rice_meals');
      expect(donation.dietaryType, 'veg');
      expect(donation.fssaiNumber, '11223344556677');
      expect(donation.fssaiDeclaration, true);
      expect(donation.totalQuantity, 30.0);
      expect(donation.availableQuantity, 20.0);
      expect(donation.unit, 'meals');
      expect(donation.street, '101 Market Lane');
      expect(donation.areaLocality, 'Indiranagar');
      expect(donation.city, 'Bengaluru');
      expect(donation.district, 'Bengaluru Urban');
      expect(donation.state, 'Karnataka');
      expect(donation.postalCode, '560038');
      expect(donation.country, 'India');
      expect(donation.allergens, ['dairy']);
      expect(donation.donorName, 'City Bistro');
    });

    test('ReservationModel deserialization and Handover Code', () {
      final jsonReservation = {
        '_id': 'res456',
        'donation': {
          '_id': 'don123',
          'title': '30 Portions Veggie Curry',
          'unit': 'meals',
        },
        'requestedQuantity': 10,
        'status': 'approved',
        'handoverCode': 'FB-8842',
        'donor': {'name': 'City Bistro'},
        'recipient': {'name': 'Hope Harvest NGO'},
        'requestNotes': 'For evening shelter distribution',
      };

      final res = ReservationModel.fromJson(jsonReservation);
      expect(res.id, 'res456');
      expect(res.donationTitle, '30 Portions Veggie Curry');
      expect(res.requestedQuantity, 10.0);
      expect(res.status, 'approved');
      expect(res.handoverCode, 'FB-8842');
      expect(res.donorName, 'City Bistro');
      expect(res.recipientName, 'Hope Harvest NGO');
    });

    test('PickupModel route and lifecycle mapping', () {
      final jsonPickup = {
        '_id': 'pk789',
        'donation': {'title': 'Fresh Artisan Bread', 'unit': 'boxes'},
        'reservation': {'requestedQuantity': 4},
        'status': 'assigned',
        'pickupAddress': {'street': '44 Baker St', 'city': 'Bengaluru'},
        'deliveryAddress': {'street': '12 Hope Ave', 'city': 'Bengaluru'},
        'donor': {'name': 'Sunrise Bakery'},
        'recipient': {'name': 'Community Food Pantry'},
      };

      final task = PickupModel.fromJson(jsonPickup);
      expect(task.id, 'pk789');
      expect(task.donationTitle, 'Fresh Artisan Bread');
      expect(task.requestedQuantity, 4.0);
      expect(task.status, 'assigned');
      expect(task.pickupStreet, '44 Baker St');
      expect(task.deliveryStreet, '12 Hope Ave');
    });

    test('OrganizationModel deserialization', () {
      final jsonOrg = {
        '_id': 'org1',
        'organizationName': 'Hope Harvest Foundation',
        'organizationType': 'Registered NGO',
        'registrationNumber': 'NGO-882190',
        'email': 'contact@hopeharvest.org',
        'phone': '9876543210',
        'address': {'street': '77 Charity Way', 'city': 'Bengaluru'},
        'verificationStatus': 'PENDING',
      };

      final org = OrganizationModel.fromJson(jsonOrg);
      expect(org.id, 'org1');
      expect(org.name, 'Hope Harvest Foundation');
      expect(org.type, 'Registered NGO');
      expect(org.verificationStatus, 'PENDING');
      expect(org.city, 'Bengaluru');
    });

    test('IndiaConstants validation and formatting helpers', () {
      // 28 states + 8 UTs = 36 total
      expect(IndiaConstants.indianStates.length, 36);
      expect(IndiaConstants.indianStates.contains('Karnataka'), true);
      expect(IndiaConstants.indianStates.contains('Delhi'), true);

      // Indian phone validation
      expect(IndiaConstants.isValidIndianPhone('9876543210'), true);
      expect(IndiaConstants.isValidIndianPhone('+919876543210'), true);
      expect(IndiaConstants.isValidIndianPhone('+91 98765 43210'), true);

      // PIN code validation
      expect(IndiaConstants.isValidPINCode('560038'), true);
      expect(IndiaConstants.isValidPINCode('110001'), true);
      expect(IndiaConstants.isValidPINCode('012345'), false);

      // Phone formatting
      expect(IndiaConstants.formatIndianPhone('9876543210'), '+91 98765 43210');

      // Currency formatting
      expect(IndiaConstants.formatINR(150000), '₹1,50,000');
      expect(IndiaConstants.formatINR(500), '₹500');
    });
  });

  testWidgets('Annadhara App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const AnnadharaApp());
    expect(find.byType(AnnadharaApp), findsOneWidget);
  });
}
