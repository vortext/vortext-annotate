/*
 * Copyright 2014 Joel Kuiper
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package spa;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.pdfbox.cos.COSDocument;
import org.apache.pdfbox.pdfparser.PDFParser;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.color.PDGamma;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationTextMarkup;
import org.apache.pdfbox.util.Matrix;
import org.apache.pdfbox.util.PDFTextStripper;
import org.apache.pdfbox.util.TextPosition;

/**
 * This class implements the methods highlight and highlightDefault which will add a highlight to the PDF based on a
 * Pattern or String. The idea is to extend the PDFTextStripper and override the methods that write to the Output to
 * instead write to a TextCache that keeps data on the position of the TextPositions. From this information we can then
 * derive bounding boxes (and quads) that can be used to write the annotations. See the main method for example usage.
 *
 * @author Joel Kuiper <me@joelkuiper.eu>
 *
 */
public class TextHighlight extends PDFTextStripper
{

    private float verticalTolerance = 0;
    private float heightModifier = (float) 1.250;

    /**
     * Internal utility class
     */
    private class Match
    {
        public final String str;
        public final List<TextPosition> positions;

        public Match(final String str, final List<TextPosition> positions)
        {
            this.str = str;
            this.positions = positions;
        }
    }

    /**
     * Internal utility class that keeps a mapping from the text contents to their TextPositions.
     * This is needed to compute bounding boxes.
     * The data is stored on a per-page basis (keyed on the 1-based pageNo)
     */
    private class TextCache
    {
        private final Map<Integer, StringBuilder> texts = new TreeMap<Integer, StringBuilder>();
        private final Map<Integer, ArrayList<TextPosition>> positions = new TreeMap<Integer, ArrayList<TextPosition>>();

        private StringBuilder obtainStringBuilder(final Integer pageNo)
        {
            StringBuilder sb = texts.get(pageNo);
            if (sb == null)
            {
                sb = new StringBuilder();
                texts.put(pageNo, sb);
            }
            return sb;
        }

        private ArrayList<TextPosition> obtainTextPositions(final Integer pageNo)
        {
            ArrayList<TextPosition> textPositions = positions.get(pageNo);
            if (textPositions == null)
            {
                textPositions = new ArrayList<TextPosition>();
                positions.put(pageNo, textPositions);
            }
            return textPositions;
        }

        public String getText(final Integer pageNo)
        {
            return obtainStringBuilder(pageNo).toString();
        }

        public String getText()  {
            StringBuilder text = new StringBuilder();
            for(StringBuilder sb : texts.values()) {
                text.append(sb.toString());
            }
            return text.toString();
        }

        public List<TextPosition> getTextPositions(final Integer pageNo)
        {
            return obtainTextPositions(pageNo);
        }

        public void append(final String str, final TextPosition pos)
        {
            final int currentPage = getCurrentPageNo();
            final ArrayList<TextPosition> positions = obtainTextPositions(currentPage);
            final StringBuilder sb = obtainStringBuilder(currentPage);

            for (int i = 0; i < str.length(); i++) {
                char nextChar = str.charAt(i);
                if(sb.length() >= 1) {
                    char previousChar = sb.charAt(sb.length() - 1);

                    if(Character.isWhitespace(nextChar) && Character.isWhitespace(previousChar)) {
                        continue;
                    }
                }
                sb.append(nextChar);
                positions.add(pos);
            }
        }

        /**
         * Given a page and a pattern it will return a list of matches for that pattern.
         * A Match is a tuple of <String, List<TextPositions>>
         *
         * @param pageNo
         * @param pattern
         * @return list of matches
         */
        public List<Match> match(final Integer pageNo, final Pattern pattern)
        {
            final Matcher matcher = pattern.matcher(this.getText(pageNo));
            final List<Match> matches = new ArrayList<Match>();

            while (matcher.find())
            {
                final List<TextPosition> elements = getTextPositions(pageNo).subList(
                        matcher.start(), matcher.end());
                matches.add(new Match(matcher.group(), elements));
            }
            return matches;
        }
    }

    private TextCache textCache;
    private PDGamma defaultColor;

    /**
     * Instantiate a new object. This object will load properties from PDFTextAnnotator.properties and will apply
     * encoding-specific conversions to the output text.
     *
     * @param encoding The encoding that the output will be written in.
     * @throws IOException If there is an error reading the properties.
     */
    public TextHighlight(final String encoding) throws IOException
    {
        super(encoding);
    }

    /**
     * Computes a series of bounding boxes (PDRectangle) from a list of TextPositions.
     * It will create a new bounding box if the verticalTolerance is exceeded
     *
     * @param positions
     * @throws IOException
     */
    public List<PDRectangle> getTextBoundingBoxes(final List<TextPosition> positions)
    {
        final List<PDRectangle> boundingBoxes = new ArrayList<PDRectangle>();

        float lowerLeftX = -1, lowerLeftY = -1, upperRightX = -1, upperRightY = -1;
        boolean first = true;
        for (int i = 0; i < positions.size(); i++)
        {
            final TextPosition position = positions.get(i);
            if (position == null)
            {
                continue;
            }
            final Matrix textPos = position.getTextPos();
            final float height = position.getHeight() * getHeightModifier();
            if (first)
            {
                lowerLeftX = textPos.getXPosition();
                upperRightX = lowerLeftX + position.getWidth();

                lowerLeftY = textPos.getYPosition();
                upperRightY = lowerLeftY + height;
                first = false;
                continue;
            }

            // we are still on the same line
            if (Math.abs(textPos.getYPosition() - lowerLeftY) <= getVerticalTolerance())
            {
                upperRightX = textPos.getXPosition() + position.getWidth();
                upperRightY = textPos.getYPosition() + height;
            }
            else
            {
                final PDRectangle boundingBox = boundingBox(lowerLeftX, lowerLeftY, upperRightX, upperRightY);
                boundingBoxes.add(boundingBox);

                // new line
                lowerLeftX = textPos.getXPosition();
                upperRightX = lowerLeftX + position.getWidth();

                lowerLeftY = textPos.getYPosition();
                upperRightY = lowerLeftY + height;
            }
        }
        if (!(lowerLeftX == -1 && lowerLeftY == -1 && upperRightX == -1 && upperRightY == -1))
        {
            final PDRectangle boundingBox = boundingBox(lowerLeftX, lowerLeftY, upperRightX,
                    upperRightY);
            boundingBoxes.add(boundingBox);
        }
        return boundingBoxes;
    }

    private PDRectangle boundingBox(final float lowerLeftX, final float lowerLeftY, final float upperRightX, final float upperRightY)
    {
        final PDRectangle boundingBox = new PDRectangle();
        boundingBox.setLowerLeftX(lowerLeftX);
        boundingBox.setLowerLeftY(lowerLeftY);
        boundingBox.setUpperRightX(upperRightX);
        boundingBox.setUpperRightY(upperRightY);
        return boundingBox;
    }

    /**
     * Highlights a pattern within the PDF with the default color.
     * Returns the list of added annotations for further modification
     * Note: it will process every page, but cannot process patterns that span multiple pages
     * Note: it will not work for top-bottom text (such as Chinese)
     *
     * @param pattern String that will be converted to Regex pattern
     * @throws IOException
     */
    public List<PDAnnotationTextMarkup> highlightDefault(final String pattern) throws IOException
    {
        return this.highlightDefault(Pattern.compile(pattern));
    }

    /**
     * Highlights a pattern within the PDF with the default color.
     * Returns the list of added annotations for further modification.
     * Note: it will process every page, but cannot process patterns that span multiple pages.
     * Note: it will not work for top-bottom text (such as Chinese)
     *
     * @param pattern Pattern (regex)
     * @throws IOException
     */
    public List<PDAnnotationTextMarkup> highlightDefault(final Pattern pattern) throws IOException
    {
        final List<PDAnnotationTextMarkup> highlights = this.highlight(pattern,
                PDAnnotationTextMarkup.SUB_TYPE_HIGHLIGHT);
        for (final PDAnnotationTextMarkup highlight : highlights)
        {
            highlight.setConstantOpacity((float) 0.8);
            highlight.setColour(getDefaultColor());
            highlight.setPrinted(true);
        }
        return highlights;
    }

    public List<PDAnnotationTextMarkup> highlight(final String pattern, final String subType)
            throws IOException
    {
        return this.highlight(Pattern.compile(pattern), subType);
    }

    @SuppressWarnings("unchecked")
    public List<PDAnnotationTextMarkup> highlight(final Pattern pattern, final String subType) throws IOException
    {
        if (textCache == null || document == null)
        {
            throw new IllegalArgumentException("TextCache was not initilized");
        }

        final List<PDPage> pages = document.getDocumentCatalog().getAllPages();

        final ArrayList<PDAnnotationTextMarkup> newAnnotations = new ArrayList<PDAnnotationTextMarkup>();

        for (int pageIndex = getStartPage() - 1; pageIndex < getEndPage() && pageIndex < pages.size(); pageIndex++)
        {
            final PDPage page = pages.get(pageIndex);
            final List<PDAnnotation> annotations = page.getAnnotations();

            final List<Match> matches = textCache.match(pageIndex + 1, pattern);

            for (final Match match : matches)
            {
                final List<PDRectangle> textBoundingBoxes = getTextBoundingBoxes(match.positions);

                if (textBoundingBoxes.size() > 0)
                {
                    final PDAnnotationTextMarkup annotation = new PDAnnotationTextMarkup(subType);

                    annotation.setRectangle(textBoundingBoxes.get(0));

                    final float[] quads = this.getQuads(textBoundingBoxes);

                    annotation.setQuadPoints(quads);
                    annotation.setContents(match.str);

                    annotations.add(annotation);
                    newAnnotations.add(annotation);
                }
            }
        }
        return newAnnotations;
    }

    /**
     * Computes a float array of size 8 * length(rects) with all the vertices of the consecutive PDRectangles
     */
    public float[] getQuads(final List<PDRectangle> rects)
    {
        final float[] quads = new float[8 * rects.size()];
        int cursor = 0;
        for (final PDRectangle rect : rects)
        {
            final float[] tmp = this.getQuads(rect);
            for (int i = 0; i < tmp.length; i++)
            {
                quads[cursor + i] = tmp[i];
            }
            cursor = cursor + 8;
        }
        return quads;
    }

    /**
     * Computes a float array of size eight with all the vertices of the PDRectangle
     */
    public float[] getQuads(final PDRectangle rect)
    {
        final float[] quads = new float[8];
        // top left
        quads[0] = rect.getLowerLeftX(); // x1
        quads[1] = rect.getUpperRightY(); // y1
        // bottom left
        quads[2] = rect.getUpperRightX(); // x2
        quads[3] = quads[1]; // y2
        // top right
        quads[4] = quads[0]; // x3
        quads[5] = rect.getLowerLeftY(); // y3
        // bottom right
        quads[6] = quads[2]; // x4
        quads[7] = quads[5]; // y5
        return quads;
    }

    public void setDefaultColor(final PDGamma color)
    {
        defaultColor = color;
    }

    public PDGamma getDefaultColor()
    {
        if (defaultColor != null)
        {
            return defaultColor;
        }
        else
        { // #fbe85a
            final PDGamma c = new PDGamma();
            c.setR((float) 0.9843);
            c.setG((float) 0.9098);
            c.setB((float) 0.3879);
            return c;
        }
    }

    /**
     * The vertical tolerance determines whether a character is still on the same line
     */
    public float getVerticalTolerance()
    {
        return verticalTolerance;
    }

    /**
     * {@link getVerticalTolerance}
     */
    public void setVerticalTolerance(final float tolerance)
    {
        verticalTolerance = tolerance;
    }

    /**
     * The height modifier is applied to the font height, it allows the annotations to be changed by a certain factor
     */
    public float getHeightModifier()
    {
        return heightModifier;
    }

    /**
     * {@link getHeightModifier}
     */
    public void setHeightModifier(final float heightModifier)
    {
        this.heightModifier = heightModifier;
    }

    /*
     * The following methods are overwritten from the PDTextStripper
     */
    @SuppressWarnings("unchecked")
    public void initialize(final PDDocument pdf) throws IOException
    {
        resetEngine();
        document = pdf;
        textCache = new TextCache();

        if (getAddMoreFormatting())
        {
            setParagraphEnd(getLineSeparator());
            setPageStart(getLineSeparator());
            setArticleStart(getLineSeparator());
            setArticleEnd(getLineSeparator());
        }
        startDocument(pdf);
        processPages(pdf.getDocumentCatalog().getAllPages());
        endDocument(pdf);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void resetEngine()
    {
        super.resetEngine();
        textCache = null;
    }

    /**
     * Start a new article, which is typically defined as a column on a single page (also referred to as a bead).
     * Default implementation is to do nothing. Subclasses may provide additional information.
     *
     * @param isltr true if primary direction of text is left to right.
     * @throws IOException If there is any error writing to the stream.
     */
    @Override
    protected void startArticle(final boolean isltr) throws IOException
    {
        final String articleStart = getArticleStart();
        textCache.append(articleStart, null);
    }

    /**
     * End an article. Default implementation is to do nothing. Subclasses may provide additional information.
     *
     * @throws IOException If there is any error writing to the stream.
     */
    @Override
    protected void endArticle() throws IOException
    {
        final String articleEnd = getArticleEnd();
        textCache.append(articleEnd, null);
    }

    /**
     * Start a new page. Default implementation is to do nothing. Subclasses may provide additional information.
     *
     * @param page The page we are about to process.
     *
     * @throws IOException If there is any error writing to the stream.
     */
    @Override
    protected void startPage(final PDPage page) throws IOException
    {
        // default is to do nothing.
    }

    /**
     * End a page. Default implementation is to do nothing. Subclasses may provide additional information.
     *
     * @param page The page we are about to process.
     *
     * @throws IOException If there is any error writing to the stream.
     */
    @Override
    protected void endPage(final PDPage page) throws IOException
    {
        // default is to do nothing
    }

    /**
     * Write the page separator value to the text cache.
     *
     * @throws IOException If there is a problem writing out the pageseparator to the document.
     */
    @Override
    protected void writePageSeperator()
    {
        final String pageSeparator = getPageSeparator();
        textCache.append(pageSeparator, null);
    }

    /**
     * Write the line separator value to the text cache.
     *
     * @throws IOException If there is a problem writing out the lineseparator to the document.
     */
    @Override
    protected void writeLineSeparator()
    {
        final String lineSeparator = getLineSeparator();
        textCache.append(lineSeparator, null);
    }

    /**
     * Write the word separator value to the text cache.
     *
     * @throws IOException If there is a problem writing out the wordseparator to the document.
     */
    @Override
    protected void writeWordSeparator()
    {
        final String wordSeparator = getWordSeparator();
        textCache.append(wordSeparator, null);
    }

    /**
     * Write the string in TextPosition to the text cache.
     *
     * @param text The text to write to the stream.
     */
    @Override
    protected void writeCharacters(final TextPosition text)
    {
        final String character = text.getCharacter();
        textCache.append(character, text);

    }

    /**
     * Write a string to the text cache. The default implementation will ignore the <code>text</code> and just calls
     * {@link #writeCharacters(TextPosition)} .
     *
     * @param text The text to write to the stream.
     * @param textPositions The TextPositions belonging to the text.
     */
    @Override
    protected void writeString(final String text, final List<TextPosition> textPositions)
    {
        for (final TextPosition textPosition : textPositions)
        {
            writeCharacters(textPosition);
        }
    }

    private boolean inParagraph;

    /**
     * writes the paragraph separator string to the text cache.
     *
     * @throws IOException
     */
    @Override
    protected void writeParagraphSeparator()
    {
        writeParagraphEnd();
        writeParagraphStart();
    }

    /**
     * Write something (if defined) at the start of a paragraph.
     *
     * @throws IOException
     */
    @Override
    protected void writeParagraphStart()
    {
        if (inParagraph)
        {
            writeParagraphEnd();
            inParagraph = false;
        }

        final String paragraphStart = getParagraphStart();
        textCache.append(paragraphStart, null);
        inParagraph = true;
    }

    /**
     * Write something (if defined) at the end of a paragraph.
     *
     * @throws IOException
     */
    @Override
    protected void writeParagraphEnd()
    {
        final String paragraphEnd = getParagraphEnd();
        textCache.append(paragraphEnd, null);

        inParagraph = false;
    }

    /**
     * Write something (if defined) at the start of a page.
     *
     * @throws IOException
     */
    @Override
    protected void writePageStart()
    {
        final String pageStart = getPageStart();
        textCache.append(pageStart, null);
    }

    /**
     * Write something (if defined) at the start of a page.
     *
     * @throws IOException
     */
    @Override
    protected void writePageEnd()
    {
        final String pageEnd = getPageEnd();
        textCache.append(pageEnd, null);
    }

    @Override
    public String getText(final PDDocument doc) throws IOException
    {
        throw new IllegalArgumentException("Not applicable for TextHighlight");
    }

    @Override
    @Deprecated
    public String getText(final COSDocument doc) throws IOException
    {
        throw new IllegalArgumentException("Not applicable for TextHighlight");
    }

    @Override
    @Deprecated
    public void writeText(final COSDocument doc, final Writer outputStream) throws IOException
    {
        throw new IllegalArgumentException("Not applicable for TextHighlight");
    }

    @Override
    public void writeText(final PDDocument doc, final Writer outputStream) throws IOException
    {
        throw new IllegalArgumentException("Not applicable for TextHighlight");
    }

    public String getText() throws IOException
    {
        return textCache.getText();
    }

    /* main */
    public static void main(final String args[]) throws Exception
    {
        if (args.length != 3)
        {
            usage();
        }
        PDDocument pdDoc = null;
        final File file = new File(args[0]);

        if (!file.isFile())
        {
            System.err.println("File " + args[0] + " does not exist.");
            return;
        }

        final PDFParser parser = new PDFParser(new FileInputStream(file));

        parser.parse();
        pdDoc = new PDDocument(parser.getDocument());

        final TextHighlight pdfHighlight = new TextHighlight("UTF-8");
        // depends on what you want to match, but this creates a long string without newlines
        pdfHighlight.setLineSeparator(" ");
        pdfHighlight.initialize(pdDoc);

        pdfHighlight.highlightDefault(args[2]);

        pdDoc.save(args[1]);
        try
        {
            if (parser.getDocument() != null)
            {
                parser.getDocument().close();
            }
            if (pdDoc != null)
            {
                pdDoc.close();
            }
        }
        catch (final Exception e)
        {
            e.printStackTrace();
        }
    }

    private static void usage()
    {
        System.err.println("Usage: <input-pdf> <output-pdf> <pattern>");
    }
}
