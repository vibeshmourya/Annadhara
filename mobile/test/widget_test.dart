import 'package:flutter_test/flutter_test.dart';
import 'package:foodbridge_mobile/main.dart';

void main() {
  testWidgets('FoodBridge App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FoodBridgeApp());
    expect(find.byType(FoodBridgeApp), findsOneWidget);
  });
}
