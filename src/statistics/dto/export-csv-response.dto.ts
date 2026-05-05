export class ExportCsvResponseDto {
  /**
   * Download file name.
   * Example: "appointments.csv"
   */
  fileName: string;

  /**
   * MIME type: always "text/csv".
   */
  contentType: string;

  /**
   * CSV payload content.
   * First row is headers, subsequent rows are appointment records.
   */
  content: string;
}
