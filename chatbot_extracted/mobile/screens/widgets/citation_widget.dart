import 'package:flutter/material.dart';
import '../../../core/constants/colors.dart';
import '../../../models/ai_message_model.dart';

class CitationWidget extends StatelessWidget {
  final List<CitationModel> citations;

  const CitationWidget({super.key, required this.citations});

  @override
  Widget build(BuildContext context) {
    if (citations.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.only(top: 8),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppColors.border, width: 0.8),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.language, size: 12, color: AppColors.primaryGreen),
              const SizedBox(width: 4),
              Text(
                'VERIFIED SOURCES (${citations.length})',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: AppColors.darkGreen,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ...citations.map((cite) {
            return Container(
              margin: const EdgeInsets.only(bottom: 4),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: cite.isOfficial
                    ? AppColors.lightGreen.withOpacity(0.5)
                    : AppColors.background,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: cite.isOfficial
                      ? AppColors.primaryGreen.withOpacity(0.3)
                      : AppColors.border,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    cite.isOfficial ? Icons.verified : Icons.public,
                    size: 14,
                    color: cite.isOfficial ? AppColors.primaryGreen : AppColors.secondaryText,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          cite.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryText,
                          ),
                        ),
                        Text(
                          cite.domain,
                          style: TextStyle(
                            fontSize: 9,
                            color: cite.isOfficial
                                ? AppColors.darkGreen
                                : AppColors.secondaryText,
                            fontWeight: cite.isOfficial ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.open_in_new, size: 12, color: AppColors.secondaryText),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
