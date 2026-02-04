<script setup lang="ts">
import { inject, reactive, watch } from "vue"
import { FrontendService, SERVICE_KEY } from "@frontend/stores"
import { isAuthenticatedUser } from "@domain/actors/authenticatedUser"
import { Account, UsageStatus } from "@domain/models/authentication/user"
import { AccountRole } from "@domain/actors"
import { Views } from ".."
import { useRoute } from "vue-router"

const { states, helpers } = inject<FrontendService>(SERVICE_KEY)!
const route = useRoute()
const showWelcome = route.query.welcome === "true"

// Default empty account
const emptyAccount: Account = {
  id: "",
  role: AccountRole.anonymous(),
  usageStatus: UsageStatus.activated,
  displayName: "",
  name: {
    givenName: "",
    familyName: "",
  },
  email: "",
  photoUrl: undefined
}

const account = reactive<Account>({ ...emptyAccount })

const syncProfile = () => {
  const actor = states.shared.actor
  if (isAuthenticatedUser(actor)) {
    Object.assign(account, actor.account)
  } else {
    Object.assign(account, emptyAccount)
  }
}

// Initial sync
syncProfile()

// Watch for changes
watch(() => states.shared.actor, syncProfile)

const onCancel = () => {
  helpers.navigateTo(`${Views.Main.path}${Views.Profile.path}`)
}

const onSave = () => {
  // TODO: 保存処理を実装
  console.log("Save profile:", account)
}

const onConfirm = () => {
  // TODO: アカウント有効化と保存処理
  console.log("Confirm profile:", account)
}
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card width="600" elevation="2" rounded="lg">
      <v-img height="200" src="https://cdn.vuetifyjs.com/images/cards/server-room.jpg" cover></v-img>

      <div class="d-flex justify-center" style="margin-top: -50px; position: relative; z-index: 1;">
        <v-avatar size="100" class="elevation-4">
          <v-img v-if="account.photoUrl" :src="account.photoUrl" :alt="account.displayName" />
          <span class="text-h4" v-else>{{ account.displayName.charAt(0) }}</span>
        </v-avatar>
      </div>

      <v-card-text class="text-center pt-4">
        <h2 class="text-h5 font-weight-bold mb-1">{{ account.displayName }}</h2>
        <div class="text-body-2 text-medium-emphasis mb-4">{{ account.email }}</div>

        <v-alert v-if="showWelcome && account.usageStatus === UsageStatus.created" type="success" variant="tonal"
          class="mb-4 text-left" closable title="Welcome to Inspector!" text="まずはプロフィールを設定して、アカウントを有効化しましょう。"></v-alert>

        <v-divider class="my-3"></v-divider>

        <v-form class="text-left">
          <v-text-field v-model="account.displayName" label="Display Name" prepend-icon="mdi-account" variant="outlined"
            density="comfortable" class="mb-3" :rules="[(v) => !!v || 'Display name is required']"></v-text-field>

          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="account.name.familyName" label="Family Name" prepend-icon="mdi-account-outline"
                variant="outlined" density="comfortable"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="account.name.givenName" label="Given Name" variant="outlined"
                density="comfortable"></v-text-field>
            </v-col>
          </v-row>

          <v-text-field v-model="account.name.middleName" label="Middle Name (Optional)"
            prepend-icon="mdi-account-outline" variant="outlined" density="comfortable" class="mb-3"></v-text-field>

          <v-text-field v-model="account.email" label="Email" prepend-icon="mdi-email" variant="outlined"
            density="comfortable" readonly class="mb-3" hint="Email cannot be changed" persistent-hint></v-text-field>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <template v-if="showWelcome && account.usageStatus === UsageStatus.created">
          <v-btn color="primary" variant="elevated" @click="onConfirm">
            <v-icon icon="mdi-check" class="mr-1"></v-icon>
            Confirm
          </v-btn>
        </template>

        <template v-else>
          <v-btn color="grey" variant="text" @click="onCancel">
            <v-icon icon="mdi-close" class="mr-1"></v-icon>
            Cancel
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="onSave" disabled>
            <v-icon icon="mdi-content-save" class="mr-1"></v-icon>
            Save
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped></style>
