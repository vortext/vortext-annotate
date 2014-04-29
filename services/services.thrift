namespace java spa.services.services

include "structs.thrift"
include "exceptions.thrift"

service PDFParser {
        void ping(),
        // Calls the pdf parser to return, given a binary pdf, the RawPDF
        Document parse(1:string binary)

        oneway void shutdown()
}

service Filter {
        void ping(),

        // Filters are elements of a pipeline.
        // They receieve a document and yield a different (modified) document
        Document filter(1:Document document) throws (1:ProcessException error),

        oneway void shutdown()
}