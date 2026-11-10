import 'package:flutter_test/flutter_test.dart';
import 'package:foodbridge_mobile/main.dart';
import 'package:foodbridge_mobile/models/user_model.dart';
import 'package:foodbridge_mobile/models/donation_model.dart';
import 'package:foodbridge_mobile/models/reservation_model.dart';
import 'package:foodbridge_mobile/models/pickup_model.dart';
import 'package:foodbridge_mobile/models/organization_model.dart';

void main() {
  group('Annadhara Model Unit Tests', () {
    test('UserModel deserialization and role checks', () {
      final jsonDonor = {
        '_id': 'u1',
        'name': 'Green Bistro',
        'email': 'donor@greenbistro.com',
        'role': 'DONOR',
        'phone': '1234567890',
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

    test('DonationModel deserialization and field mapping', () {
      final jsonDonation = {
        '_id': 'don123',
        'title': '30 Portions Veggie Curry',
        'category': 'cooked_meals',
        'description': 'Freshly prepared vegetarian curry with brown rice',
        'totalQuantity': 30,
        'availableQuantity': 20,
        'reservedQuantity': 10,
        'collectedQuantity': 0,
        'unit': 'meals',
        'storageHandling': 'hot_held',
        'allergens': ['dairy'],
        'pickupLocation': {
          'address': {
            'street': '101 Market Lane',
            'city': 'Metropolis',
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
      expect(donation.category, 'cooked_meals');
      expect(donation.totalQuantity, 30.0);
      expect(donation.availableQuantity, 20.0);
      expect(donation.unit, 'meals');
      expect(donation.street, '101 Market Lane');
      expect(donation.city, 'Metropolis');
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
        'pickupAddress': {'street': '44 Baker St', 'city': 'Metropolis'},
        'deliveryAddress': {'street': '12 Hope Ave'},
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
        'organizationType': 'NGO',
        'registrationNumber': 'NGO-882190',
        'email': 'contact@hopeharvest.org',
        'phone': '555-0199',
        'address': {'street': '77 Charity Way', 'city': 'Metropolis'},
        'verificationStatus': 'PENDING',
      };

      final org = OrganizationModel.fromJson(jsonOrg);
      expect(org.id, 'org1');
      expect(org.name, 'Hope Harvest Foundation');
      expect(org.type, 'NGO');
      expect(org.verificationStatus, 'PENDING');
      expect(org.city, 'Metropolis');
    });
  });

  testWidgets('Annadhara App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const AnnadharaApp());
    expect(find.byType(AnnadharaApp), findsOneWidget);
  });
}
