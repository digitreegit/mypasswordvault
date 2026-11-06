package com.skyface.mypasswordvault;

import android.app.assist.AssistStructure;
import android.os.CancellationSignal;
import android.service.autofill.AutofillService;
import android.service.autofill.FillCallback;
import android.service.autofill.FillRequest;
import android.service.autofill.FillResponse;
import android.service.autofill.SaveCallback;
import android.service.autofill.SaveRequest;
import android.widget.RemoteViews;
import androidx.annotation.NonNull;

/**
 * Phase C scaffold: registers as an Autofill service.
 * Real credential matching requires a native vault bridge (see docs/autofill.md).
 */
public class PasswordAutofillService extends AutofillService {
  @Override
  public void onFillRequest(
      @NonNull FillRequest request,
      @NonNull CancellationSignal cancellationSignal,
      @NonNull FillCallback callback) {
    // Placeholder: no datasets until the encrypted vault can be queried from native code.
    // Returning null tells the framework we have nothing for this request.
    callback.onSuccess(null);
  }

  @Override
  public void onSaveRequest(@NonNull SaveRequest request, @NonNull SaveCallback callback) {
    callback.onSuccess();
  }

  @SuppressWarnings("unused")
  private RemoteViews simplePresentation(String text) {
    RemoteViews views =
        new RemoteViews(getPackageName(), android.R.layout.simple_list_item_1);
    views.setTextViewText(android.R.id.text1, text);
    return views;
  }

  @SuppressWarnings("unused")
  private static boolean looksLikeLoginForm(AssistStructure structure) {
    return structure != null && structure.getWindowNodeCount() > 0;
  }
}
